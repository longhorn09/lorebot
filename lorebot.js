"use strict";
require("babel-polyfill"); //https://babeljs.io/docs/usage/polyfill/
const Discord = require("discord.js");
var moment = require('moment');     // npm install moment
const config = require('./config.json');
const querystring = require('querystring'); //for parsing commands specified in !query
const client = new Discord.Client();
var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var isGroupChat = false;
const MAX_ITEMS = 3;
const BRIEF_LIMIT = 50;
const MYSQL_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss"; // for use with moment().format(MYSQL_DATETIME_FORMAT)

var pool = mysql.createPool({
  connectionLimit: 100,
  host:'localhost',
  user: config.username,
  password: config.password,
  database: config.database,
  debug: false
});

/**
* Function for parsing the lore from a post in Discord chat
* @param {string} pAuthor
* @param {string} pLore
*/
var parseLore = (pAuthor , pLore) => {
  let affects = null, objName = null, tmpStr = null;
  let attribName = null,attribName2 = null,attribValue2 = null,attribValue = null;
  let itemType = null,matClass = null,material = null,weight = null,value = null,speed = null, power = null
               ,accuracy = null,effects = null,itemIs  = null,charges = null, containerSize = null, capacity = null;
  let spell = null; // level
  let restricts = null,immune = null,apply = null,weapClass = null,damage = null;
  let extra = null;// ##################### NOT YET CODED OUT ##############################
  let isUpdateSuccess = false;
  let hasBlankLine = false;
  let match = null;
  let splitArr = [];
  let is2part = false;
  let attribRegex = /^([A-Z][A-Za-z\s]+)\:(.+)$/;   //do not use /g here or matching issues
  let objRegex = /^Object\s'(.+)'$/;  //removed g flag
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  //The behavior associated with the 'g' flag is different when the .exec() method is used.
  //console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : pLore[0]: ${pLore.trim().split("\n")[0].trim()}`);

  // need to still do regex text in case of: https://github.com/longhorn09/lorebot/issues/9

  if (objRegex.test(pLore.trim().split("\n")[0].trim())) {
    //console.log(`matched: ${pLore.trim().split("\n")[0].trim()}`);
    match = objRegex.exec(pLore.trim().split("\n")[0].trim());
    objName = match[1];

    //we don't need to start loop at item[0] because we already matched the Object name in row[0]
    splitArr = pLore.trim().split("\n");
    for (let i = 1; i < splitArr.length; i++)
    {
      //make sure to reset capture variables to null each loop
      attribName = null, attribValue = null,
      attribName2 = null, attribValue2 = null;
      match = null;
      is2part = false;

      if (attribRegex.test(splitArr[i].toString().trim()) === true) {
        match = attribRegex.exec(splitArr[i].toString().trim());
        if (match !== null)
        {
          attribName = match[1].trim();
          if (match[2].trim().indexOf(":")>0)
          {
            if (/^(.+)\s+([A-Z][a-z\s]+)\:(.+)$/.test(match[2].trim())) //natural    Material:organic
            {
              is2part = true;
              match = /^(.+)\s+([A-Z][a-z\s]+)\:(.+)$/.exec(match[2].trim()); //Make sure regex.exec() exactly matches regex.test() stmt 4 lines above
              attribValue = match[1].trim();
              attribName2 = match[2].trim();
              attribValue2 = match[3].trim();
            }
            else {
              //console.log(`No match on 2nd half: ${match[2].trim()}`);  // this shouldn't happen
            }
          }
          else {    // 1-parter
            attribValue = match[2].trim();
          }

          switch(attribName.toLowerCase().trim()){
            case "item type":
              itemType = attribValue;
              break;
            case "contains":
              containerSize = /^(\d+)$/g.test(attribValue)  ? Number.parseInt(attribValue.trim()) : null;
              break;
            case "capacity":
              capacity = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "mat class":
              matClass = attribValue;
              break;
            case "material":
              material = attribValue;
              break;
            case "weight":
              weight = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue) : null;
              break;
            case "value":
              value  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "speed":
              speed  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "power":
              power  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "accuracy":
              accuracy  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "effects":
              effects = attribValue;
              break;
            case "item is":
              itemIs = attribValue;
              break;
            case "charges":
              charges  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "level":
              spell = attribValue;    //varchar(80)
              break;
            case "restricts":
              restricts = attribValue;
              break;
            case "immune":
              immune = attribValue;
              break;
            case "apply":
              apply  = /^(-?\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
              break;
            case "class":      ///// weapon class?
              weapClass = attribValue;
              break;
            case "damage":
              damage = attribValue;
              break;
            case "affects":
              if (affects === null) {
                affects = attribValue + ",";
              }
              else {
                affects += attribValue + ",";
              }
              break;
          } //end of 1-parter

          if (attribName2 !== null && attribValue2 !== null) { //2-parter
            switch(attribName2.toLowerCase().trim()) {
              case "item type":
                itemType = attribValue2.trim();
                break;
              case "contains":
                containerSize  = /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "capacity":
                capacity  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "mat class":
                matClass = attribValue2.trim();
                break;
              case "material":
                material = attribValue2.trim();
                break;
              case "weight":
                weight  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "value":
                value  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;    //varchar(10)
                break;
              case "speed":
                speed =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "power":
                power =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "accuracy":
                accuracy  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "effects":
                effects = attribValue2.trim();
                break;
              case "item is":
                itemIs = attribValue2.trim();
                break;
              case "charges":
                charges  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "level":
                spell = attribValue2.trim();
                break;
              case "restricts":
                restricts = attribValue2.trim();
                break;
              case "immune":
                immune = attribValue2.trim();
                break;
              case "apply":
                apply  =  /^(-?\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
                break;
              case "class":      ///// weapon class?
                weapClass = attribValue2.trim();
                break;
              case "damage":
                damage = attribValue2.trim();
                break;
              case "affects":
                if (affects === null) {
                    affects = attribValue2.trim() + ",";
                }
                else {
                  affects +=  attribValue2.trim() + ",";
                }

                break;
            }   //end of 2-parter
          //console.log(`[${i}]: ${attribName}: ${attribValue} , ${attribName2}: ${attribValue2}`);
          } //2-parter null test
        } //end if match[1] !== null
        else{ //usually empty line, but may be Extra to be captured here
          console.log(`splitArr[${i}] no match: ${splitArr[i].trim()}`);
        }
      }   //end if regex.test on first pattern match
    } //end of for loop
  } //end of objRegex.test()
  else {
    console.log(`no match in parseLore(): ${pLore.trim().split("\n")[0].trim()}`);
  }

  //just a check to make sure there's something new to update and not Object '' on a single line

  if (itemType !== null || matClass !== null || material !== null || weight !== null || value !== null
        || speed !== null || power !== null || accuracy !== null || effects !== null || itemIs !== null
        || charges !== null || spell !== null || restricts !== null || immune !== null  || apply !== null
        || weapClass !== null || damage !== null || affects !== null || containerSize !== null || capacity !== null)
  {
    // Do not comment the below out, the trimming of trailing comma is necessary and not just for debug purposes
    if (affects   != null) {
        affects = affects.substring(0,affects.length-1); //cull the trailing comma
    }

    // lore matched and attributes and key values captured
    // so initiate db create/update process via sp call of CreateLore
    let rowsAffected = 0;
    CreateUpdateLore(objName,itemType,itemIs,pAuthor,affects,apply,restricts,weapClass,matClass,material,
                    value,extra,immune,effects,weight,capacity,spell,containerSize,charges,speed,accuracy,power,damage, (arg) => {
                      rowsAffected = arg;
                      console.log(`** in CreateUpdateLore callback ${rowsAffected}`);
                    });


  }  //end test if attributes are all null
} //end of function parseLore
//##########################################################################
//# Converts comma separated
//##########################################################################
var formatAffects = (pArg) => {
  let retvalue = "";
  let affectsArr = [];
  let sb = "";
  //let affectBy = /([A-Za-z_\s]+)\s*by\s*([-+]?\d+)/;
  let affectBy = /^([A-Za-z_\s]+)\s*by\s*(.+)$/;
  let match = null;

  affectsArr = pArg.trim().split(",");
  for (let i = 0;i<affectsArr.length;i++){
    if (affectBy.test(affectsArr[i].toString().trim()) )
    {
      match = affectBy.exec(affectsArr[i].toString().trim());
      //console.log("matched: " + affectsArr[i]);
      //console.log(match[1].toUpperCase().padEnd(14) + "by " + match[2]);
      if (match[1].trim() === "casting level" ||
          match[1].trim() === "spell slots" ) //keep these lower case
      {
          sb += "Affects".padEnd(9) + ": " + match[1].trim().padEnd(14) + "by " + match[2] + "\n";
      }
      else if (match[1].trim().toLowerCase().startsWith("skill ")) {  // lore formatting for skills
          sb += "Affects".padEnd(9) + ": " + match[1].trim().toLowerCase().padEnd(20) + "by " + match[2] + "\n";
      }
      else if (match[1].trim().length >= 13) {
        sb += "Affects".padEnd(9) + ": " + match[1].trim().toLowerCase() + " by  " + match[2] + "\n"; // note: 2 trailing spaces after by
      }
      else {
        sb += "Affects".padEnd(9) + ": " + match[1].trim().toUpperCase().padEnd(14) + "by " + match[2] + "\n";
      }
    }
    else {
      //console.log("didn't match: " + affectsArr[i]);       //this is going to be single lines like : regeneration 14%
      sb += "Affects".padEnd(9) + ": " + affectsArr[i].toString().trim() + "\n";
    }
  }
  retvalue = sb;
  return retvalue;
}



var  formatLore = (pMsg,pRows) => {
  let sb = "";
  for (let i = 0; i < Math.min(pRows.length,MAX_ITEMS);i++){
    sb = "";
    sb += `\nObject '${pRows[i].OBJECT_NAME}'\n`;

    if (pRows[i].ITEM_TYPE != null) sb += `Item Type: ${pRows[i].ITEM_TYPE}\n`;
    if (pRows[i].MAT_CLASS != null) sb += `Mat Class: ${(pRows[i].MAT_CLASS).padEnd(13)}Material : ${pRows[i].MATERIAL}\n`;
    if (pRows[i].WEIGHT    != null) sb += `Weight   : ${(pRows[i].WEIGHT.toString()).padEnd(13)}Value    : ${pRows[i].ITEM_VALUE}\n`;
    if (pRows[i].AFFECTS   != null) sb += `${formatAffects(pRows[i].AFFECTS)}`;
    if (pRows[i].SPEED     != null) sb += `Speed    : ${pRows[i].SPEED}\n`;
    if (pRows[i].POWER     != null) sb += `Power    : ${pRows[i].POWER}\n`;
    if (pRows[i].ACCURACY  != null) sb += `Accuracy : ${pRows[i].ACCURACY}\n`;
    if (pRows[i].EFFECTS   != null) sb += `Effects  : ${pRows[i].EFFECTS}\n`;
    if (pRows[i].ITEM_IS   != null) sb += `Item is  : ${pRows[i].ITEM_IS.toUpperCase()}\n`;
    if (pRows[i].CHARGES   != null) sb += `Charges  : ${pRows[i].CHARGES}\n`;
    if (pRows[i].ITEM_LEVEL!= null) sb += `Level    : ${pRows[i].ITEM_LEVEL}\n`;
    if (pRows[i].RESTRICTS != null) sb += `Restricts: ${pRows[i].RESTRICTS.toUpperCase()}\n`;
    if (pRows[i].IMMUNE    != null) sb += `Immune   : ${pRows[i].IMMUNE}\n`;
    if (pRows[i].APPLY     != null) sb += `Apply    : ${pRows[i].APPLY}\n`;
    if (pRows[i].CLASS     != null) sb += `Class    : ${pRows[i].CLASS}\n`;
    if (pRows[i].DAMAGE    != null) sb +=        `Damage   : ${pRows[i].DAMAGE}\n`;
    if (pRows[i].CONTAINER_SIZE   != null) sb += `Contains : ${pRows[i].CONTAINER_SIZE}\n`;
    if (pRows[i].CAPACITY    != null) sb +=      `Capacity : ${pRows[i].CAPACITY}\n`;

    if (pRows[i].SUBMITTER != null) sb += `Submitter: ${pRows[i].SUBMITTER} (${pRows[i].CREATE_DATE})\n`;

    if (pMsg.channel != null && pMsg.channel.name === config.channel)
    {
      pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
        console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in formatLore(): ${err}`);
      });
    }
    else {
      pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
        console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in formatLore(): ${err}`);
      });
    }
    //pMsg.author.send( sb, {code: true});
  }
  return sb;
};

var formatBrief = (pMsg,pRows) => {
  let sb = "";
  for (let i = 0; i < Math.min(pRows.length,BRIEF_LIMIT);i++){
    //sb = "";
    sb += `\nObject '${pRows[i].OBJECT_NAME}'`;
    //console.log("```" + sb + "```");
  }
  pMsg.author.send(sb,{code:true});
  return sb;
};


/**
 * capturing pastes of look from in game, expect behavior is discord user pastes it in chat
 * either singly or in bulk
 * @param {function} callback
 */
var CreateUpdatePerson =  (charName,light,ring1,ring2,neck1,neck2,body,head,legs,feet,arms,slung,
                  hands,shield,about,waist,pouch,rwrist,lwrist,weap1,weap2,held,both_hands,submitter,clan_id,callback) => {
    let sqlStr = "";
    pool.getConnection((err,connection)=>{
        if (err) {
          connection.release();
          res.json({"code":100,"status":"Error in db connecion in CreateUpdatePerson in pool.getConnect(callback)"});
        }
      sqlStr = "call CreatePerson(" + (((charName) ? `'${charName.replace("'","\\'")}'` : null) + "," +
                                    ((light) ? `'${light.replace("'","\\'")}'` : null) + "," +
                                    ((ring1) ? `'${ring1.replace("'","\\'")}'` : null) + "," +
                                    ((ring2) ? `'${ring2.replace("'","\\'")}'` : null) + "," +
                                    ((neck1) ? `'${neck1.replace("'","\\'")}'` : null) + "," +
                                    ((neck2) ? `'${neck2.replace("'","\\'")}'` : null) + "," +
                                    ((body) ? `'${body.replace("'","\\'")}'` : null) + "," +
                                    ((head) ? `'${head.replace("'","\\'")}'` : null) + "," +
                                    ((legs) ? `'${legs.replace("'","\\'")}'` : null) + "," +
                                    ((feet) ? `'${feet.replace("'","\\'")}'` : null) + "," +
                                    ((arms) ? `'${arms.replace("'","\\'")}'` : null) + "," +
                                    ((slung) ? `'${slung.replace("'","\\'")}'` : null) + "," +
                                    ((hands) ? `'${hands.replace("'","\\'")}'` : null) + "," +
                                    ((shield) ? `'${shield.replace("'","\\'")}'` : null) + "," +
                                    ((about) ? `'${about.replace("'","\\'")}'` : null) + "," +
                                    ((waist) ? `'${waist.replace("'","\\'")}'` : null) + "," +
                                    ((pouch) ? `'${pouch.replace("'","\\'")}'` : null) + "," +
                                    ((rwrist) ? `'${rwrist.replace("'","\\'")}'` : null) + "," +
                                    ((lwrist) ? `'${lwrist.replace("'","\\'")}'` : null) + "," +
                                    ((weap1) ? `'${weap1.replace("'","\\'")}'` : null) + "," +
                                    ((weap2) ? `'${weap2.replace("'","\\'")}'` : null) + "," +
                                    ((held) ? `'${held.replace("'","\\'")}'` : null) + "," +
                                    ((both_hands) ? `'${both_hands.replace("'","\\'")}'` : null) + "," +
                                    ((submitter) ? `'${submitter.replace("'","\\'")}'` : null) + "," +
                                    ((clan_id) ? clan_id : null)
                                      + ")"); //placeholder for clan_id


      //console.log(sqlStr);
      connection.query(sqlStr,(err,rows) => {
        connection.release();
        if (!err) {
          if (rows.length >= 0) {
            return callback(charName);
          }
          else {
            return callback(charName);
          }
        }
        else {
          console.log(err);
        }
      });
      connection.on('error',(err) => {
        //res.json({"code":100,"status":"Error in connection database"});
        console.log({"code":100,"status":"Error in connection database"});
        return;
      });
    });   //end of pool.getConnection() callback function
  };  //END of CreateUpdateLore function

/**
 * This is the handler for !recent command and will return results from GetRecent mysql db stored proc call
 */
 function ProcessRecent(pMsg) {
   let submitter = null;
   let sqlStr = "call GetRecent()";
   let sb = "";

   if (pMsg !== null) {
     submitter = pMsg.author.username.toString();
   }

   console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${submitter.padEnd(30)} !recent` );
   pool.getConnection((err,connection)=>{
       if (err) {
         connection.release();
         res.json({"code":100,"status":"Error in db connecion in ProcessRecent in pool.getConnect(callback)"});
       }  //end if (err)

       connection.query(sqlStr,(err,rows) => {
         connection.release();
         if (!err && rows != null && rows.length > 0 && rows[0].length > 0) {
           for (let i = 0; i < rows[0].length;i++) {
             if (rows[0][i].TBL_SRC === "Lore"){
               //sb += `${moment(rows[0][i].CREATE_DATE).format("YYYY-MM-DD")}: !query object_name=${rows[0][i].DESCRIPTION}\n`;
               sb += `${moment(rows[0][i].CREATE_DATE).format("YYYY-MM-DD")}: Object '${rows[0][i].DESCRIPTION}'\n`;
             }
             else {

               sb += `${moment(rows[0][i].CREATE_DATE).format("YYYY-MM-DD")}: !who ${rows[0][i].DESCRIPTION}\n`;
             }

           } //end for loop
           if (sb !== null && sb.length > 0) {
             if (pMsg.channel != null && pMsg.channel.name === config.channel)
             {
               pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                 console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in ${ProcessRecent.name}}: ${err}`);
               });
             }
             else {
               pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                 console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in ${ProcessRecent.name}}: ${err}`);
               });
             }
           }
         }
         else {
           console.log(`Error in ${ProcessRecent.name}: ${err}`);
         }
       });
       connection.on('error',(err) => {
         //res.json({"code":100,"status":"Error in connection database"});
         console.log({"code":100,"status":"Error in connection database"});
         return;
       });

   });    //end of pool.GetConnection callback)
 } //end of ProcessRecent() function

/**
 * This function is called after a user pastes a lore in chat typically -
 * then the db update stored procedure call is initiated
 * CreateUpdateLore typically called from parseLore()
 * @param {function} callback
 */
function CreateUpdateLore(objName,itemType,itemIs,submitter,affects,apply,restricts,weapClass,matClass,material,itemValue,extra,
                          immune,effects,weight,capacity,itemLevel,containerSize,charges,speed,accuracy,power,damage,callback) {
  let sqlStr = "";
  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in db connecion in CreateUpdateLore in pool.getConnect(callback)"});
      }
    // sqlStr = `call CreateLore('${objName}','${itemType}','${itemIs}','${submitter}','${affects}',${apply},'${restricts}',
    //                           '${weapClass}','${matClass}','${material}','${itemValue}','${extra}','${immune}','${effects}',${weight},
    //                           ${capacity},'${itemLevel}',${containerSize},${charges},${speed},${accuracy},
    //                           ${power},'${damage}')`;
    //console.log(`weight: ${weight}`)
    //console.log (`${submitter} attempt update/insert '${objName}'`);
    sqlStr = "call CreateLore(" + (((objName) ? `'${objName.replace("'","\\'")}'` : null) + "," +
                                  ((itemType) ? `'${itemType}'` : null) + "," +
                                  ((itemIs) ? `'${itemIs}'` : null) + "," +
                                  ((submitter) ? `'${submitter}'` : null) + "," +
                                  ((affects) ? `'${affects}'` : null) + "," +
                                  ((apply) ? apply : null) + "," +
                                  ((restricts) ? `'${restricts}'` : null) + "," +
                                  ((weapClass) ? `'${weapClass}'` : null) + "," +
                                  ((matClass) ? `'${matClass}'` : null) + "," +
                                  ((material) ? `'${material}'` : null) + "," +
                                  ((itemValue) ? `'${itemValue}'` : null) + "," +
                                  ((extra) ? `'${extra}'` : null) + "," +
                                  ((immune) ? `'${immune}'` : null) + "," +
                                  ((effects) ? `'${effects}'` : null) + "," +
                                  ((weight) ? weight : null) + "," +
                                  ((capacity) ? capacity : null) + "," +
                                  ((itemLevel) ? `'${itemLevel}'` : null) + "," +
                                  ((containerSize) ? containerSize : null) + "," +
                                  ((charges) ? charges : null) + "," +
                                  ((speed) ? speed : null) + "," +
                                  ((accuracy) ? accuracy : null) + "," +
                                  ((power) ? power : null) + "," +
                                  ((damage) ? `'${damage}'` : null) + ")" );


    //console.log(sqlStr);
    connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
        if (rows.length >= 0) {
          console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${submitter.padEnd(30)} insert/update '${objName}'` );
          //console.log (`${submitter} SUCCESS update/insert '${objName}'`);
          //return callback(rows[0][0].LoreCount);
          return;
        }
        else {
          console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${submitter.padEnd(30)} insert/update '${objName}'` );
          //return callback(rows[0][0].LoreCount);
          return;
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });   //end of pool.getConnection() callback function
};  //END of CreateUpdateLore function

/**
 * this function is typically called from ParseEqLook
 *
 */
function DoLookLogCapture(light , ring1 , ring2 , neck1 , neck2 , body , head , legs , feet ,
      arms , slung , hands , shield , about , waist , pouch , rwrist ,
      lwrist , primary , secondary , held , both ) {

}

/**
 * this captures pastes of EQ looks in support of !who functionality
 */
var ParseEqLook = (pSubmitter, pLookLog) => {
  let light = null, ring1 = null, ring2 = null, neck1 = null, neck2 = null, body = null, head = null, legs = null, feet = null,
              arms = null, slung = null, hands = null, shield = null, about = null, waist = null, pouch = null, rwrist = null,
              lwrist = null, primary = null, secondary = null, held = null, both = null;
  let charName = null;
  let line = null;
  let splitArr = null;
  let wearWorn = null;
  let match = null;

  splitArr = pLookLog.split("\n");

  //console.log(`splitArr.length: ${splitArr.length}`);
  for (let i = 0; i < splitArr.length;i++) {
    line =  splitArr[i].trim();
    wearWorn = null;
    if (/^([A-Z][a-z]+) is using:$/g.test( splitArr[i].trim())) {
      charName =  /^([A-Z][a-z]+) is using:$/.exec(line)[1];
      //console.log (`ParseEqLook(charName): ${charName}`);
    }
    else if ( /^<([a-z\s]+)>\s+(.+)$/.test(line)  ) {
      match = /^<([a-z\s]+)>\s+(.+)$/.exec(line);
      //console.log(`matched <${/^<([a-z\s]+)>\s+(.+)$/.exec(line)[1]}>`);
      switch(match[1].trim()) {
        case "used as light":
          light = match[2].trim();
          break;
        case "worn on finger":
          if (ring1 != null && ring1.length > 0) {
            ring2 = match[2].trim();
          }
          else {
            ring1 = match[2].trim();
          }
          break;
        case "worn around neck":
          if (neck1 != null && neck1.length > 0) {
            neck2 = match[2].trim();
          }
          else {
            neck1 = match[2].trim();
          }
          break;
        case "worn on body":
          body = match[2].trim();
          break;
        case "worn on head":
          head = match[2].trim();
          break;
        case "worn on legs":
         legs = match[2].trim();
          break;
        case "worn on feet":
          feet = match[2].trim();
          break;
        case "worn on arms":
          arms = match[2].trim();
          break;
        case "slung over shoulder":
          slung = match[2].trim();
          break;
        case "worn on hands":
          hands = match[2].trim();
          break;
        case "worn as shield":
          shield = match[2].trim();
          break;
        case "worn about body":
          about = match[2].trim();
          break;
        case "worn about waist":
          waist = match[2].trim();
          break;
        case "worn as pouch":
          pouch = match[2].trim();
          break;
        case "worn around right wrist":
          rwrist = match[2].trim();
          break;
        case "worn around left wrist":
          lwrist = match[2].trim();
          break;
        case "used in primary hand":
          primary = match[2].trim();
          break;
        case "used in secondary hand":
          secondary = match[2].trim();
          break;
        case "held in secondary hand":
          held = match[2].trim();
          break;
        case "used in both hands":
          both = match[2].trim();
          break;
        default:
          break;
      }
    }
    else {
      break;
    }
  } //end for loop

  if (light !== null || ring1 !== null || ring2 !== null || neck1 !== null || neck2 !== null ||
      body !== null || head !== null || legs !== null || feet !== null || arms !== null || slung !== null ||
      hands !== null || shield !== null || about !== null || waist !== null || pouch !== null ||
      rwrist !== null || lwrist !== null || primary !== null || secondary !== null || held !== null ||
      both !== null)
  {
    let padLen = "<worn around right wrist>  ".length;
    // NOTE: clan_id is hardcoded to null after submiter for now as parameter placeholder
    CreateUpdatePerson(charName,light,ring1,ring2,neck1,neck2,body,head,legs,feet,arms,slung,
                      hands,shield,about,waist,pouch,rwrist,lwrist,primary,secondary,held,both,pSubmitter,null, (arg) => {
                      console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${pSubmitter.padEnd(30)} Logged '${arg}'`);
                    });
  } //end of not null values test condition - ie. we have something to actually update
  return;
} //end of function ParseEqLook

/**
 * for !stat bronze.shield
 */
function GetLoreCount(callback){
  let sqlStr = "";
  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }
    sqlStr = `call GetLoreCount() `;
    //console.log(sqlStr);
    connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
        if (rows.length >= 0) {
          return callback(rows[0][0].LoreCount);
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database in GetLoreCount()"});
      return;
    });
  });
};

/**
 * for !stat bronze.shield
 */
function handle_database(pMsg,whereClause,pItem){
  let sqlStr = "";
  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }
    sqlStr = `SELECT * FROM Lore ${whereClause}`;
    //console.log(`sqlStr non-escaped: ${sqlStr}\n               sqlStr escaped: ${mysql.escape(sqlStr)}`);
    connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
        if (rows.length >= 0) {
          if (rows.length === 1) {
            if (pMsg.channel != null && pMsg.channel.name === config.channel)
            {
              pMsg.channel.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            else {
              pMsg.author.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            //pMsg.author.send(`${rows.length} item found for '${pItem}'`) ;
          }
          else if (rows.length > MAX_ITEMS )          {
            if (pMsg.channel != null && pMsg.channel.name === config.channel)
            {
              pMsg.channel.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            else {
              pMsg.author.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            //pMsg.author.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`);
          }
          else {
            if (pMsg.channel != null && pMsg.channel.name === config.channel)
            {
              pMsg.channel.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            else {
              pMsg.author.send(`${rows.length} item found for '${pItem}'`,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
              });
            }
            //pMsg.author.send(`${rows.length} item found for '${pItem}'`);
          }
          if (rows.length > 0) {
            return formatLore(pMsg,rows) ;
          }
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};

/**
 * for !query command
 * which has a wide range of flexibility
 * @param {object} pMsg
 * @param {string} pSQL
 */
function DoFlexQueryDetail(pMsg,pSQL) {
  let sb = "";
  let sb1 = "";       // used as the 2nd part of a msg that broke 2000 characters
  let msg2 = false;   // used to flag the 2nd part of msg to be sent
  let totalItems = 0; 

  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }

    connection.query(pSQL,(err,rows) => {

      connection.release();
      if (!err) {
        if (rows.length > 0) {
          totalItems = rows[0]["LIST_COUNT"];
          for (let i = 0; i < Math.min(rows.length,BRIEF_LIMIT);i++) {
              if (sb.length < 1900) {
                sb += `Object '${rows[i]['OBJECT_NAME'].trim()}'\n`;
              } else {
                if (!msg2) {msg2 = true;}
                sb1 += `Object '${rows[i]['OBJECT_NAME'].trim()}'\n`;
              }
          }
          //console.log(`sb.length: ${sb.length}`); // for debugging: discord has a 2,000 character limit
          if (totalItems > BRIEF_LIMIT) {
            pMsg.author.send("```" + `${totalItems} items found. Displaying first ${BRIEF_LIMIT} items.\n` +
                    sb + "```");
          }
          else {
            if (pMsg.channel != null && pMsg.channel.name === config.channel) {
              if (totalItems == 1) {pMsg.channel.send(`${totalItems} item found.`) ;}
              else {pMsg.channel.send(`${totalItems} items found.`) ;}
              if (msg2) {
                pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
                });
                pMsg.channel.send(sb1,{code: true}).catch( (err,msg) => {
                  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
                });
              } 
              else {
                pMsg.channel.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
                });
              }
            }
            else {
              if (totalItems == 1) {pMsg.author.send(`${totalItems} item found.`) ;}
              else {pMsg.author.send(`${totalItems} items found.`) ;}
              if (msg2) {
                pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
                });
                pMsg.author.send(sb1,{code: true}).catch( (err,msg) => {
                  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
                });
              } 
              else {
                pMsg.author.send(sb,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
                  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
               });
              }
            }
          }
        }
        else {
          pMsg.author.send(`${totalItems} items found.`) ; // ie. 0
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};



/**
 * for !query command
 * which has a wide range of flexibility
 * @param {object} pMsg
 * @param {string} pField
 * @param {string} pSQL
 */
function DoFlexQuery(pMsg,pField,pSQL) {
  let FLEX_QUERY_LIMIT = 20;

  switch (pField) {
    case "CLASS":
    case "ITEM_TYPE":
    case "MAT_CLASS":
    case "MATERIAL":
    case "SUBMITTER":
      FLEX_QUERY_LIMIT=50;
      break;
    default:
      FLEX_QUERY_LIMIT=20;
      break;

  }
  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }

    connection.query(pSQL,(err,rows) => {
      let sb = "";
      let totalItems = 0;
      connection.release();
      if (!err) {
        if (rows.length > 0) {
          totalItems = rows[0]["LIST_COUNT"];
          for (let i = 0; i < Math.min(rows.length,FLEX_QUERY_LIMIT);i++) {
              sb += rows[i][pField].trim() + "\n";
          }
          //console.log(`sb.length: ${sb.length}`); // for debugging: discord has a 2,000 character limit
          if (totalItems > FLEX_QUERY_LIMIT) {

            pMsg.author.send("```" + `${totalItems} values found for '${pField}'. Displaying first ${FLEX_QUERY_LIMIT} items.\n` +
                    sb + "```");
          }
          else if (totalItems == 1) {
            pMsg.author.send(`${totalItems} value found for '${pField}'`) ;
            pMsg.author.send(sb, {code: true});
          }
          else {
            pMsg.author.send(`${totalItems} values found for '${pField}'`) ;
            pMsg.author.send(sb, {code: true});
          }
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};

/**
 * for !brief shield
 */
function handle_brief(pMsg,whereClause,pItem){
  let sqlStr = "";
  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in connection database"});
      }
    sqlStr = `SELECT * FROM Lore ${whereClause}`;
    //console.log(sqlStr);
    connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
        if (rows.length >= 0) {
          if (rows.length === 1) {
            pMsg.author.send(`${rows.length} item found for '${pItem}'`) ;
          }
          else if (rows.length > BRIEF_LIMIT )          {
            pMsg.author.send(`${rows.length} items found for '${pItem}'. Displaying first ${BRIEF_LIMIT} items.`);
          }
          else {
            pMsg.author.send(`${rows.length} item found for '${pItem}'`);
          }
          if (rows.length > 0) {
            return formatBrief(pMsg,rows);
          }
        }
      }
      else {
        console.log(err);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};

function ProcessBrief(message, isGchat)
{
  let searchItem = "";
  let splitArr = [];
  let str = "",
    whereClause = " WHERE 1=1 ";
  let dateTime = null;

  dateTime = moment().format("YYYY-MM-DD HH:mm:ss");

  if (message.content.trim().length > 6 && message.content.trim().substring(6,7) === " ")
  {
    str = message.content.trim();
    searchItem = (str.substring(6,str.length)).trim().toLowerCase();
    console.log(`${dateTime} : ${message.author.username.toString().padEnd(30)} !brief ${searchItem}`);
    splitArr = searchItem.split(".");
    if (splitArr.length >= 1)
    {
      for (let i = 0; i < splitArr.length; i++)    {
        //whereClause += ` and Lore.OBJECT_NAME LIKE '%${splitArr[i]}%' `
        whereClause += ` and Lore.OBJECT_NAME LIKE '%${mysql.escape(splitArr[i]).substring(1,mysql.escape(splitArr[i]).length-1)}%' `
      }
    }
     handle_brief(message,whereClause,searchItem);
  }
  else {
    if (isGchat){
      message.channel.send(`Invalid usage. Example: !brief bronze.shield`);
    }
    else {
      message.author.send(`Invalid usage. Example: !brief bronze.shield`);
    }

  }
};

/**
 * ProcessQuery implements a flexible query method that can search amongst
 * a number of user specified arguments using key=value format and delimited by &
 */
function ProcessQuery(message)
{
  let queryParams = null;
  let whereClause = " WHERE 1=1 ";
  let searchField = null;
  let sqlStr = null;
  let subquery = null;
  let args = [];
  let dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
  let affectsArr = [];
  let half1, half2 = null; //for parsing affects in 'damroll by 3'   , half1 = damroll, half2 = 3
  let match = null; //for regexp string pattern matching
  let isExitLoop = false;
  let searchItem = "";

  //console.log(`${message.content.trim().length} : ${(config.prefix + "query").length}`);
  if (message.content.trim().length >(config.prefix + "query").length ) {
    queryParams = message.content.trim().substring((config.prefix + "query").length,message.content.trim().length).replace(/\+/g, '%2B');
    queryParams = queryParams.trim();
    if (queryParams.indexOf("=") > 0 || queryParams.indexOf(">") > 0 || queryParams.indexOf("<") > 0)  {
      args = querystring.parse(queryParams.trim());
      for (let property in args) {
        if (Object.prototype.hasOwnProperty.call(args,property)) {    // https://github.com/hapijs/hapi/issues/3280
          //console.log(`${property.padEnd(15)}: ${args[property]}`);

          switch(property.toLowerCase().trim()) {
            //do all the int based properties first
            case "speed":
            case "accuracy":
            case "power":
            case "charges":
            case "weight":
            case "item_value":
            case "apply":
            case "capacity":
            case "container_size":
              if (/(\d+)/g.test(args[property])) {    //ensure valid int
                //item_value is actually stored as varchar(10) as db level, so quote wrap it
                if (property.toLowerCase().trim() == "item value" || property.toLowerCase().trim() == "item_value" || property.toLowerCase().trim() == "value" ) {
                  whereClause += ` and Lore.${property.toUpperCase()}='${args[property]}' `;
                }
                else {
                  whereClause += ` and Lore.${property.toUpperCase()}=${args[property]} `;
                }
              }
              else {  //tell user we are expecting an int
                message.author.send(`${property.toUpperCase()} must be an integer (Example: !query ${property.toUpperCase()}=5)`);
              }
              break;
            case "item_type":
            case "item_is":
            case "submitter":
            case "restricts":
            case "class":
            case "mat_class":
            case "material":
            case "immune":
            case "effects":
            case "damage":
              whereClause += ` AND (Lore.${property.toUpperCase()} LIKE '%${args[property]}%') `;
              break;
            case "affects":
              if (args[property].indexOf(",") > 0) {
                affectsArr = args[property].split(",");
                for (let i = 0; i < affectsArr.length; i++) {
                  half1 = null, half2 = null, match = null;             //initialize variables for regex pattern match results
                  if (affectsArr[i].trim().indexOf(' by ') > 0) {       // !query affects=damroll by 2,hitroll by 2
                    //console.log(`affectsArr[${i}]: ${affectsArr[i].trim()}`);
                    if (/^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.test(affectsArr[i].trim())) {
                      match = /^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.exec(affectsArr[i].trim());
                      if (match != null && match.length === 3) {      // think matching index [0,1,2] -> length = 3
                        half1 = match[1].trim();
                        var temphalf2 = match[2];
                        half2 = temphalf2.replace(/\+/g, '\\\\\+?');  // replaces all "+" with "\\+?"
                        
                        //console.log(`match[${i}]: ${half1} by ${half2}`);
                        whereClause += ` AND (Lore.${property.toUpperCase()} REGEXP '.*${half1}[[:space:]]+by[[:space:]]+${half2}.*' ) `
                      }
                    }
                    else {    // in a pattern of 'attribute by value', but it didn't match somehow, so just ignore for now, no query impact
                      console.log(`no match for ${affectsArr[i].trim()}`);
                    }
                  }
                  else {  //doesn't contain the string " by "
                    whereClause += ` AND (Lore.${property.toUpperCase()} LIKE '%${args[property]}%') `;
                  }
                } //end for loop thru affectsArr
              }
              else {  //affects property value does not contain a comma ','
                half1 = null, half2 = null, match = null;             //initialize variables for regex pattern match results
                if (args[property].trim().indexOf(' by ') > 0) {       // !query affects=damroll by 2,hitroll by 2
                  //console.log(`affectsArr[${i}]: ${affectsArr[i].trim()}`);
                  if (/^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.test(args[property].trim())) {
                    match = /^([A-Za-z_\s]+)\s+by\s+([+-]?\d+(?:[A-Za-z_\s\d]+)?)$/.exec(args[property].trim());
                    if (match != null && match.length === 3) {      // think matching index [0,1,2] -> length = 3
                      half1 = match[1].trim();
                      var temphalf2 = match[2];
                      half2 = temphalf2.replace(/\+/g, '\\\\\+?');  // replaces all "+" with "\\+?"
                      
                      //console.log(`match[${i}]: ${half1} by ${half2}`);
                      whereClause += ` AND (Lore.${property.toUpperCase()} REGEXP '.*${half1}[[:space:]]+by[[:space:]]+${half2}.*' ) `
                    }
                  }
                }
                else {
                  whereClause += ` AND (Lore.${property.toUpperCase()} LIKE '%${args[property]}%') `;
                }
              }
              break;
            case "object_name":
              whereClause += ' AND Lore.OBJECT_NAME = ' + mysql.escape(args[property]);
              searchItem = args[property].trim();
              isExitLoop = true;
              break;
            default:
              message.author.send(`Invalid property '${property.toUpperCase()}' specified. Valid properties: \n`);
              message.author.send("```" + `ITEM_TYPE\nITEM_IS\nSUBMITTER\nAFFECTS\nAPPLY\nRESTRICTS\nCLASS\nMAT_CLASS\n` +
                                          `MATERIAL\nITEM_VALUE\nIMMUNE\nEFFECTS\nWEIGHT\nCAPACITY\nCONTAINER_SIZE\nSPEED\nACCURACY\nPOWER\nDAMAGE` + "```");
              break;
          } //end switch on property
        }  //end hasOwnProperty() test
        if (isExitLoop){
          //get out of the for loop because we used object_name
          break;
        }
      } //end for loop
      //console.log(whereClause);
      subquery = "SELECT COUNT(*) from Lore " + whereClause
      sqlStr = `SELECT (${subquery}) as LIST_COUNT, LORE_ID, OBJECT_NAME from Lore ${whereClause}`;
      //console.log(`${dateTime} : ${"SQL: ".padEnd(30)} ${sqlStr}`);
      console.log(`${dateTime} : ${message.author.username.toString().padEnd(30)} ${message.content.trim()}`);
      if (!isExitLoop) {
        DoFlexQueryDetail(message,sqlStr);
      }
      else {
        handle_database(message,whereClause,searchItem);
      }



    }
    else {
      //searchField = queryParams ;
      switch(queryParams.toLowerCase()) {
        case "item_is":
          searchField = queryParams.trim().toUpperCase();
          subquery = `SELECT COUNT(DISTINCT UPPER(Lore.${queryParams.toUpperCase()})) from Lore`;
          sqlStr = `SELECT DISTINCT UPPER(${queryParams.toUpperCase()}) as '${queryParams.toUpperCase()}', (${subquery}) as 'LIST_COUNT' ` +
                   ` FROM Lore WHERE Lore.${queryParams.toUpperCase()} IS NOT NULL ` +
                   ` ORDER BY UPPER(Lore.${queryParams.toUpperCase()})` +
                   ` LIMIT ${BRIEF_LIMIT};`;
          //console.log(`sqlStr: ${sqlStr}`);
          break;
        case "item_type":
        case "submitter":
        case "affects":
        case "restricts":
          // future todo - tokenize string using stored proc
          // https://stackoverflow.com/questions/1077686/is-there-something-analogous-to-a-split-method-in-mysql
        case "class":
        case "mat_class":
        case "material":
        case "immune":
        case "effects":
        case "damage":
          searchField = queryParams.trim().toUpperCase();
          subquery = `SELECT count(distinct UPPER(Lore.${searchField})) from Lore`;
          sqlStr = `SELECT distinct UPPER(${searchField}) as '${searchField}', (${subquery}) as 'LIST_COUNT' ` +
                   ` FROM Lore WHERE ${searchField} IS NOT NULL ` +
                   ` ORDER BY UPPER(${searchField}) ASC ` +
                   ` LIMIT ${BRIEF_LIMIT};`;
          //console.log(`sqlStr: ${sqlStr}`);
          break;
        default:
        message.author.send("```Invalid field query. Example fields:\nITEM_TYPE\nITEM_IS\nSUBMITTER\nAFFECTS\nRESTRICTS\nCLASS\nMAT_CLASS\nMATERIAL\nIMMUNE\nEFFECTS\nDAMAGE\nSPEED\nPOWER\nACCURACY" +
                            "```");
          break;
      }
      if (sqlStr != null) {
        DoFlexQuery(message,searchField,sqlStr);
      }

    }

  }
  else {
    let padLen = 60;
    message.author.send("Invalid usage. Examples:" +
                        "\n!query affects".padEnd(padLen) + "(List all AFFECTS values)" +
                        "\n!query material=mithril".padEnd(padLen)  + "(Mithril items)" +
                        "\n!query affects=damroll by 2&material=cloth".padEnd(padLen) + "(Cloth 'DAMROLL by 2' items)" +
                        "\n!query material=mithril&damage=3d6" +
                        "\n!query affects=damroll by 2&item_type=worn" +
                        "\n!query affects=damroll by 2,hitroll by 2&item_type=worn".padEnd(padLen) + "(Worn items that are 'DAMROLL by 2, HITROLL by 2')", {code:true});
  }
  return; //done with ProcessQuery
}

var FormatEqLook = (rowData) => {
  let padLen = "<worn around right wrist>  ".length + 1;
  let retvalue = "";

  if (rowData.CHARNAME != null) {
    retvalue += `${rowData.CHARNAME} is using:`;
  }
  if (rowData.LIGHT != null) {
    retvalue += "\n<used as light>".padEnd(padLen) + rowData.LIGHT;
  }
  if (rowData.RING1 != null) {
    retvalue += "\n<worn on finger>".padEnd(padLen) + rowData.RING1;
  }
  if (rowData.RING2 != null) {
    retvalue += "\n<worn on finger>".padEnd(padLen) + rowData.RING2;
  }
  if (rowData.NECK1 != null) {
    retvalue += "\n<worn around neck>".padEnd(padLen) + rowData.NECK1;
  }
  if (rowData.NECK2 != null) {
    retvalue += "\n<worn around neck>".padEnd(padLen) + rowData.NECK2;
  }
  if (rowData.BODY != null) {
    retvalue += "\n<worn on body>".padEnd(padLen) + rowData.BODY;
  }
  if (rowData.HEAD != null) {
    retvalue += "\n<worn on head>".padEnd(padLen) + rowData.HEAD;
  }
  if (rowData.LEGS != null) {
    retvalue += "\n<worn on legs>".padEnd(padLen) + rowData.LEGS;
  }
  if (rowData.FEET != null) {
    retvalue += "\n<worn on feet>".padEnd(padLen) + rowData.FEET;
  }
  if (rowData.HANDS != null) {
    retvalue += "\n<worn on hands>".padEnd(padLen) + rowData.HANDS;
  }
  if (rowData.ARMS != null) {
    retvalue += "\n<worn on arms>".padEnd(padLen) + rowData.ARMS;
  }
  if (rowData.SLUNG != null) {
    retvalue += "\n<slung over shoulder>".padEnd(padLen) + rowData.SLUNG;
  }
  if (rowData.SHIELD != null) {
    retvalue += "\n<worn as shield>".padEnd(padLen) + rowData.SHIELD;
  }
  if (rowData.ABOUT != null) {
    retvalue += "\n<worn about body>".padEnd(padLen) + rowData.ABOUT;
  }
  if (rowData.WAIST != null) {
    retvalue += "\n<worn about waist>".padEnd(padLen) + rowData.WAIST;
  }
  if (rowData.POUCH != null) {
    retvalue += "\n<worn as pouch>".padEnd(padLen) + rowData.POUCH;
  }
  if (rowData.RWRIST != null) {
    retvalue += "\n<worn around right wrist>".padEnd(padLen) + rowData.RWRIST;
  }
  if (rowData.LWRIST != null) {
    retvalue += "\n<worn around left wrist>".padEnd(padLen) + rowData.LWRIST;
  }
  if (rowData.PRIMARY_WEAP != null) {
    retvalue += "\n<used in primary hand>".padEnd(padLen) + rowData.PRIMARY_WEAP;
  }
  if (rowData.SECONDARY_WEAP != null) {
    retvalue += "\n<used in secondary hand>".padEnd(padLen) + rowData.SECONDARY_WEAP;
  }
  if (rowData.HELD != null) {
    retvalue += "\n<held in secondary hand>".padEnd(padLen) + rowData.HELD;
  }
  if (rowData.BOTH_HANDS != null) {
    retvalue += "\n<used in both hands>".padEnd(padLen) + rowData.BOTH_HANDS;
  }
  if (rowData.SUBMITTER != null) {
    "YYYY-MM-DD HH:mm:ss"; // for use with moment().format(MYSQL_DATETIME_FORMAT)
    //double spacing for formatting separation
    retvalue += `\n\n${"Submitter:".padEnd(0)} ${rowData.SUBMITTER} (${moment(rowData.CREATE_DATE).format(MYSQL_DATETIME_FORMAT)})`;

  }

  return retvalue;
}
/**
 * this function does all the processing for !who including processing who target and making db stored proc call
 */
var ProcessWho = (discordMsg) => {
  let sqlStr = null;
  let returnMsg = null;
  let whoTarget = null;
  let match = null;

  //console.log(`message: ${discordMsg.content}`);
  if (/^\!who\s+([A-Za-z]+)$/g.test(discordMsg.content.trim())) {
    match = /^\!(?:w|W)(?:h|H)(?:o|O)\s+([A-Za-z]+)$/.exec(discordMsg.content.trim());  //case sensitivity check is overkill, since will always enter as !who lowercase
    whoTarget = match[1];
  }
  else {
    discordMsg.author.send("Invalid syntax. Example: !who Oligo", {code: true})   //https://discord.js.org/#/docs/main/stable/typedef/MessageOptions
      .catch( (err,msg) => {     //take care of UnhandledPromiseRejection
      console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in ProcessWho(): ${err}`); //https://stackoverflow.com/questions/44284666/discord-js-add-reaction-to-a-bot-message
      //console.log(msg.author.username );
      }
    );
    return; //get out of function, no more processing
  }


  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":"Error in db connecion in CreateUpdatePerson in pool.getConnect(callback)"});
      }
    sqlStr = `call GetPerson('${whoTarget}');`;

    connection.query(sqlStr,(err,rows) => {
      connection.release();
      if (!err) {
        if (rows != null && rows.length === 2 && rows[0].length === 1) {
          returnMsg = FormatEqLook(rows[0][0]);  // rows[0] = RowDataPacket, rows[1] = OkPacket
          //console.log(`returnMsg: ${returnMsg}`);
          console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${discordMsg.author.username.padEnd(30)} !who ${whoTarget}`);
        }
        else {
          returnMsg = `Player '${whoTarget}' not found.`;
        }

        if (discordMsg.channel != null && discordMsg.channel.name === config.channel)
        {
          discordMsg.channel.send(returnMsg,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
            console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
          });
        }
        else {
          discordMsg.author.send(returnMsg,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
            console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in handle_database(): ${err}`);
          });
        }


        // discordMsg.author.send(returnMsg, {code: true})   //https://discord.js.org/#/docs/main/stable/typedef/MessageOptions
        //   .catch( (err,msg) => {     //take care of UnhandledPromiseRejection
        //     console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in ProcessWho(): ${err}`); //https://stackoverflow.com/questions/44284666/discord-js-add-reaction-to-a-bot-message
        //   } //end callback passed to .catch()
        // );  //end catch() error handling

      } //end of !err
      else {
        console.log(`Error in ProcessWho(): ${err}`);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database during ProcessWho()"});
      return;
    });
  });   //end of pool.getConnection() callback function

}  //end of ProcessWho()


/**
 * this function does all the processing for !whoall
 */
var ProcessWhoAll = (discordMsg) => {
  let sqlStr = null;
  let returnMsg = null;
  let whoTarget = null;
  let match = null;

  //console.log(`in proc ${ProcessWhoAll.name}()`);

  pool.getConnection((err,connection)=>{
      if (err) {
        connection.release();
        res.json({"code":100,"status":`Error in db connecion in ${ProcessWhoAll.name} in pool.getConnect(callback)`});
      }
    sqlStr = `call GetPersonList();`;

    connection.query(sqlStr,(err,rows) => {
      connection.release();
      //console.log(JSON.stringify(rows));
      if (!err) {
        if (rows != null && rows.length === 2 && rows[0].length > 0 ) {
          console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : ${discordMsg.author.username.padEnd(30)} !whoall`);
          returnMsg = `${rows[0].length} records found.\n`;
          returnMsg += `-`.repeat(17) + "\n";
          for (let i = 1; i < rows[0].length + 1; i++) {
            //returnMsg += rows[0][i-1].CHARNAME.padEnd(17);
            if (i > 0 && i % 5 === 0) {
              returnMsg += rows[0][i-1].CHARNAME + "\n";
            } //end modulo
            else{
              returnMsg += rows[0][i-1].CHARNAME.padEnd(17);
            }
          } //end resultset loop
        }
        else {
          returnMsg = `No players found.`;
        }

        if (discordMsg.channel != null && discordMsg.channel.name === config.channel)
        {
          discordMsg.channel.send(returnMsg,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
            console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in ProcessWhoAll(): ${err}`);
          });
        }
        else {
          discordMsg.author.send(returnMsg,{code: true}).catch( (err,msg) => {     //take care of UnhandledPromiseRejection
            console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in ProcessWhoAll(): ${err}`);
          });
        }


      } //end of !err
      else {
        console.log(`Error in ProcessWhoAll(): ${err}`);
      }
    });
    connection.on('error',(err) => {
      //res.json({"code":100,"status":"Error in connection database"});
      console.log({"code":100,"status":"Error in connection database during ProcessWhoAll()"});
      return;
    });
  });   //end of pool.getConnection() callback function

}  //end of ProcessWhoAll()

/**
 * WHERE clause for !stat, limited to MAX_ITEMS
 */
function ProcessStat(message, isGchat)
{
  let searchItem = "";
  let splitArr = [];
  let str = "",
    whereClause = " WHERE 1=1 ";

  let dateTime = null;

  if (message.content.trim().length > 5 && message.content.trim().substring(5,6) === " ")
  {
    str = message.content.trim();
    searchItem = (str.substring(5,str.length)).trim().toLowerCase();
    dateTime = moment().format("YYYY-MM-DD HH:mm:ss");
    console.log(`${dateTime} : ${message.author.username.toString().padEnd(30)} !stat ${searchItem}`);

    splitArr = searchItem.split(".");
    if (splitArr.length >= 1)
    {
      for (let i = 0; i < splitArr.length; i++)    {
        whereClause += ` and Lore.OBJECT_NAME LIKE '%${mysql.escape(splitArr[i]).substring(1,mysql.escape(splitArr[i]).length-1)}%' `
        //whereClause += ` and Lore.OBJECT_NAME LIKE '%${splitArr[i]}%' `
      }
      //console.log(whereClause);
    }
     handle_database(message,whereClause,searchItem);
    //console.log(myrows);
  }
  else {
    if (isGchat){
      message.channel.send(`Invalid usage. Example: !stat bronze.shield`);
    }
    else {
      message.author.send(`Invalid usage. Example: !stat bronze.shield`);
    }

  }
};
//##############################################################################
//# this is the main handling of messages from Discord
//##############################################################################
client.on("message", (message) => {
  let cmd = "";
  if (message.content.startsWith(config.prefix)) {
    cmd = message.content.substring(1,message.content.length);
    //message.channel.send("pong!");
    //console.log("cmd: " + cmd);
    let parsedCmd = cmd.split(" ")[0];
    //console.log(parsedCmd);
    switch(parsedCmd)
    {
      case "roll":
        message.channel.send(message.author.username
          + " rolled a " + (1 + Math.floor(Math.random() * 6)));
          break;
      case "stat":
        ProcessStat(message, isGroupChat);
        break;
      case "query":
        //console.log("in query");
        ProcessQuery(message);
        break;
      case "brief":
        ProcessBrief(message, isGroupChat);
        break;
      case "mark":
        message.author.send("!mark in development");
        break;
      case "who":
        //message.author.send("!who in development");
        ProcessWho(message);
        break;
      case "whoall":
        ProcessWhoAll(message);
        break;
      case "recent":
          // message.author.send(`!recent in development`)
          //               .catch( (err,msg) => {     //take care of UnhandledPromiseRejection
          //                     console.log(`${moment().format(MYSQL_DATETIME_FORMAT)}: in function ${ProcessStat.name}(): ${err}`);
          //                   });
          ProcessRecent(message)
          break;
      case "gton":
        isGroupChat = true;
        message.channel.send("** Group chat: Enabled");
        break;
      case "gtoff":
        isGroupChat = false;
        message.channel.send("** Group chat: Disabled");
        break;
      case "help":
        let helpStr = getHelp(message);
        break;
      case "version":
        let versionMsg = "** Version unavailable";
        if (typeof process.env.npm_package_version === "string") {
          versionMsg = "** Version " + process.env.npm_package_version ;
        }
        else {
          versionMsg = "** Version " + require('./package.json').version;
        }
        (isGroupChat) ? message.channel.send(versionMsg) : message.author.send(versionMsg);
        break;
      default:
        break;
    }
    //message.author.sendMessage("Your message here.")
  }
  else if (message.content.trim().indexOf("Object '") >= 0   //need to do this way because lore might be pasted in middle of conversation
        && message.author.username.substring(0,"lorebot".length).toLowerCase() !== "lorebot")
  {
    let loreArr = null, cleanArr = [];
    //need to scrub the lore message for processing
    loreArr = message.content.trim().split("Object '");
    for (let i = 0 ; i < loreArr.length; i++)  {
      if (loreArr[i].indexOf("'") > 0 && loreArr[i].indexOf(":"))
      {
        //console.log(`loreArr[${i}]: ${loreArr[i]}`);
        cleanArr.push(`Object '${loreArr[i].trim()}`);
      }
    }
    for (let i = 0 ;i < cleanArr.length;i++) {
        //console.log(`cleanArr[${i}]: ${cleanArr[i]}`);
        parseLore(message.author.username,cleanArr[i]);
    }
    loreArr = null;   //freeup for gc()
    cleanArr = null;  //freeup for gc()
  }
  else if (message.content.trim().indexOf(" is using:") >0
        && message.author.username.substring(0,"lorebot".length).toLowerCase() !== "lorebot")
  {
    let lookArr = null, cleanArr = [], charName = null;
    lookArr = message.content.trim().split(/([A-Z][a-z]+) is using:/);
    for (let i = 0; i < lookArr.length; i++) {
      if  (/^([A-Z][a-z]+)$/.test(lookArr[i].trim())) {
        charName = lookArr[i].trim();
      }
      else if (lookArr[i].trim().indexOf("<") === 0 && charName != null && charName.length > 0)
      {
        cleanArr.push(`${charName} is using:\n${lookArr[i].trim()}`);
        charName = null;
      }
      else {
        charName = null;
      }
    }
    for (let i = 0; i < cleanArr.length; i++){
      //console.log(`cleanArr[${i}]: ${cleanArr[i]}`);
      ParseEqLook(message.author.username,cleanArr[i]);
    }


    cleanArr = null;
    lookArr = null;
  }
  else {
    //console.log(`Didn't match message: ${message.content.trim()}`);

  }
  //if(message.author.id !== config.ownerID) return;
});

function getHelp(pMsg) {
  let version = "(n/a)";
  if (typeof process.env.npm_package_version === "string") {
    version = process.env.npm_package_version ;
  }
  else {
    version = require('./package.json').version;
  }
  //https://stackoverflow.com/questions/21206696/how-to-return-value-from-node-js-function-which-contains-db-query
  GetLoreCount((numRows) => {
    let helpMsg  = "** IRC Lore Bot v" + version + ` (Items: ${numRows}) **\n` +
    "!help    - Lists the different commands available\n" +
    "!stat    - syntax: !stat <item>, example: !stat huma.shield\n" +
    "!brief   - syntax: !brief <item>, example: !brief huma.shield\n" +
    "!mark    - example: !mark kaput rgb cleric, or !mark kaput rgb\n" +
    "!unmark  - unidentifies a character, example: !unmark kaput\n" +
    "!who     - shows character info, example: !who Drunoob\n" +
    "!whoall  - shows all characters\n" +
    //"!gton    - turn on output group chat\n" +
    //"!gtoff   - turn off output to group chat\n" +
    "!query   - flexible query with multiple crieria, example: !query affects=damroll by 2\n" +
    "!recent  - shows latest lores and looks\n" +
    "!version - shows version history\n";
    version = null; //markings, optional !recent <num>

    pMsg.author.send(helpMsg,{code:true});
  });
  return;
}


client.login(config.token);
client.on("ready", () => {
  console.log("Lorebot ready!");
});
