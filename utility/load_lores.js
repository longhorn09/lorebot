"use strict";
require("babel-polyfill"); //https://babeljs.io/docs/usage/polyfill/
const fs = require('fs');
const mysql = require('mysql');
const path = require('path');
const config = require('../config.json');
const moment = require('moment');     // npm install moment
const USER_NAME = "Virgo";
const MYSQL_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss"; // for use with moment().format(MYSQL_DATETIME_FORMAT)

// Virgo - lores_virgo.txt
// Pazzar - lores_2016_wipe.txt


var pool = mysql.createPool({
  connectionLimit: 100,
  host:'localhost',
  user: config.username,
  password: config.password,
  database: config.database,
  debug: false
});



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
  console.log(`${moment().format(MYSQL_DATETIME_FORMAT)} : pLore[0]: ${pLore.trim().split("\n")[0].trim()}`);

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
              apply  = /^(\d+)$/g.test(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
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
                apply  =  /^(\d+)$/g.test(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
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
    return CreateUpdateLore(objName,itemType,itemIs,pAuthor,affects,apply,restricts,weapClass,matClass,material,
                    value,extra,immune,effects,weight,capacity,spell,containerSize,charges,speed,accuracy,power,damage, (arg) => {
                      rowsAffected = arg;
                      console.log(`** in CreateUpdateLore callback ${rowsAffected}`);
                    });


  }  //end test if attributes are all null
} //end of function parseLore

/**
 * Cleans up lores - preprocessing for lore processing
 */
function ProcessLoreFile(message) {
  let loreArr = null, cleanArr = [];
  //need to scrub the lore message for processing
  loreArr = message.trim().split("Object '");
  for (let i = 0 ; i < loreArr.length; i++)  {
    if (loreArr[i].indexOf("'") > 0 && loreArr[i].indexOf(":"))
    {
      //console.log(`loreArr[${i}]: ${loreArr[i]}`);
      cleanArr.push(`Object '${loreArr[i].trim()}`);
    }
  }
  for (let i = 0 ;i < cleanArr.length;i++) {
      //console.log(`cleanArr[${i}]: ${cleanArr[i]}`);
      parseLore("Pazzar",cleanArr[i]);
  }
  loreArr = null;   //freeup for gc()
  cleanArr = null;  //freeup for gc()
  return;
}

/**
 * Main lore file
 */
function DoMain() {
  const INPUT_FILE = path.join(__dirname,'lores_2016_wipe.txt');
  console.log(`INPUT_FILE: ${INPUT_FILE}`);
  fs.readFile(INPUT_FILE, {encoding:"utf8"},(err, data) => {
    if (err) throw err;
    ProcessLoreFile(data);
    //console.log(data);
    return;
  });
  return;
}

DoMain();
return;
