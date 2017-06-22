"use strict";
require("babel-polyfill"); //https://babeljs.io/docs/usage/polyfill/
const Discord = require("discord.js");
var moment = require('moment');     // npm install moment
const config = require('./config.json');
const client = new Discord.Client();
var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var isGroupChat = false;
const MAX_ITEMS = 3;
const BRIEF_LIMIT = 50;
const MYSQL_DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss"; // for use with moment.format(MYSQL_DATETIME_FORMAT)

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
  //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  //The behavior associated with the 'g' flag is different when the .exec() method is used.
  match = (/^Object\s'(.+)'$/g).exec(pLore.trim().split("\n")[0].trim());
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
      //console.log(`splitArr[${i}] matched: ${splitArr[i].trim()}`);
      match = attribRegex.exec(splitArr[i].toString().trim());
      //match = attribRegex.exec(splitArr[i].trim());
      if (match !== null)
      {
        //console.log(`[${i}] attrib: ${match[1].trim()}, val: ${match[2].trim()}`);
        attribName = match[1].trim();
        if (match[2].trim().indexOf(":")>0)
        {
          //console.log(`2 parter: ${match[2].trim()}`)  ;
          if (/^(.+)\s+([A-Z][a-z\s]+)\:(.+)$/.test(match[2].trim())) //natural    Material:organic
          {
            is2part = true;
            match = /^(.+)\s+([A-Z][a-z\s]+)\:(.+)$/.exec(match[2].trim()); //Make sure regex.exec() exactly matches regex.test() stmt 4 lines above
            //console.log(match.length);
            attribValue = match[1].trim();
            attribName2 = match[2].trim();
            attribValue2 = match[3].trim();
            //console.log(`attribName ${attribName}, attribValue: ${attribValue}`);
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
            containerSize = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "capacity":
            capacity = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "mat class":
            matClass = attribValue;
            break;
          case "material":
            material = attribValue;
            break;
          case "weight":
            weight = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "value":
            value  = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "speed":
            speed  = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "power":
            power  = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "accuracy":
            accuracy  = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
            break;
          case "effects":
            effects = attribValue;
            break;
          case "item is":
            itemIs = attribValue;
            break;
          case "charges":
            charges  = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
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
            apply  = !isNaN(attribValue) ?  Number.parseInt(attribValue.trim()) : null;
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
              containerSize  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
              break;
            case "capacity":
              capacity  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
              break;
            case "mat class":
              matClass = attribValue2.trim();
              break;
            case "material":
              material = attribValue2.trim();
              break;
            case "weight":
              weight  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
              break;
            case "value":
              value  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;    //varchar(10)
              break;
            case "speed":
              speed = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
              break;
            case "power":
              power = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
              break;
            case "accuracy":
              accuracy  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
              break;
            case "effects":
              effects = attribValue2.trim();
              break;
            case "item is":
              itemIs = attribValue2.trim();
              break;
            case "charges":
              charges  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
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
              apply  = !isNaN(attribValue2) ?  Number.parseInt(attribValue2.trim()) : null;
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
  let affectBy = /([A-Za-z_\s]+)\s*by\s*([-+]?\d+)/;
  let match = null;

  affectsArr = pArg.trim().split(",");
  for (let i = 0;i<affectsArr.length;i++){
    if (affectBy.test(affectsArr[i].toString().trim()) )
    {
      match = affectBy.exec(affectsArr[i].toString().trim());
      //console.log("matched: " + affectsArr[i]);
      //console.log(match[1].toUpperCase().padEnd(14) + "by " + match[2]);
      if (match[1].trim() === "casting level" ||
          match[1].trim() === "skill bash" ||
          match[1].trim() === "spell slots" ) //keep these lower case
      {
          sb += "Affects".padEnd(9) + ": " + match[1].trim().padEnd(14) + "by " + match[2] + "\n";
      }
      else {
        sb += "Affects".padEnd(9) + ": " + match[1].trim().toUpperCase().padEnd(14) + "by " + match[2] + "\n";
      }
    }
    else {
      console.log("didn't match: " + affectsArr[i]);
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

    //console.log("```" + sb + "```")
    pMsg.author.send("```" + sb + "```");
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
  pMsg.author.send("```" + sb + "```");
  return sb;
};

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
        res.json({"code":100,"status":"Error in connection database"});
      }
    // sqlStr = `call CreateLore('${objName}','${itemType}','${itemIs}','${submitter}','${affects}',${apply},'${restricts}',
    //                           '${weapClass}','${matClass}','${material}','${itemValue}','${extra}','${immune}','${effects}',${weight},
    //                           ${capacity},'${itemLevel}',${containerSize},${charges},${speed},${accuracy},
    //                           ${power},'${damage}')`;
    //console.log(`weight: ${weight}`)
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
          return callback(rows[0][0].LoreCount);
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

//#################################################################################
//# for !stat bronze.shield
//#################################################################################
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
      console.log({"code":100,"status":"Error in connection database"});
      return;
    });
  });
};
//#################################################################################
//# for !stat bronze.shield
//#################################################################################
function handle_database(pMsg,whereClause,pItem){
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
          else if (rows.length > MAX_ITEMS )          {
            pMsg.author.send(`${rows.length} items found for '${pItem}'. Displaying first ${MAX_ITEMS} items.`);
          }
          else {
            pMsg.author.send(`${rows.length} item found for '${pItem}'`);
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
//#################################################################################
//# for !brief shield
//#################################################################################
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
    console.log(`${dateTime} : ${message.author.username.toString().padEnd(40)} !brief ${searchItem}`);
    splitArr = searchItem.split(".");
    if (splitArr.length >= 1)
    {
      for (let i = 0; i < splitArr.length; i++)    {
        //whereClause += ` and Lore.OBJECT_NAME LIKE '%${mysql.escape(splitArr[i])}%' `
        whereClause += ` and Lore.OBJECT_NAME LIKE '%${splitArr[i]}%' `
      }
    }
     handle_brief(message,whereClause,searchItem);
    //console.log(myrows);
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

//####################################################
//# building the WHERE clause for !stat
//####################################################
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
    console.log(`${dateTime} : ${message.author.username.toString().padEnd(40)} !stat ${searchItem}`);

    splitArr = searchItem.split(".");
    if (splitArr.length >= 1)
    {
      for (let i = 0; i < splitArr.length; i++)    {
        //whereClause += ` and Lore.OBJECT_NAME LIKE '%${mysql.escape(splitArr[i])}%' `
        whereClause += ` and Lore.OBJECT_NAME LIKE '%${splitArr[i]}%' `
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
      case "brief":
        ProcessBrief(message, isGroupChat);
        break;
      case "mark":
        message.author.send("!mark in development");
        break;
      case "who":
        message.author.send("!who in development");
        break;
      case "recent":
          message.author.send("!recent in development");
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
        //(isGroupChat) ? message.channel.send(helpStr) : message.author.send(helpStr);
        //console.log("Sent " + config.prefix + cmd + " to " + message.author.username) ;
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
        cleanArr.push(`Object '${loreArr[i].trim()}`);
      }
    }
    console.log(`cleanArr.length: ${cleanArr}`);
    for (let i = 0 ;i < cleanArr.length;i++) {
        parseLore(message.author.username,cleanArr[i]);
    }
    loreArr = null;   //freeup for gc()
    cleanArr = null;  //freeup for gc()
  }
  else if (message.content.trim().indexOf(" is using:") >0)
  {
    console.log("look log:" + message.content.trim());
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
    let helpMsg  = "```** IRC Lore Bot v" + version + ` (Items: ${numRows}) **\n` +
    "!help    - Lists the different commands available\n" +
    "!stat    - syntax: !stat <item>, example: !stat huma.shield\n" +
    "!brief   - syntax: !brief <item>, example: !brief huma.shield\n" +
    "!mark    - example: !mark kaput rgb cleric, or !mark kaput rgb\n" +
    "!unmark  - unidentifies a character, example: !unmark kaput\n" +
    "!who     - shows character info, example: !who Drunoob\n" +
    //"!gton    - turn on output group chat\n" +
    //"!gtoff   - turn off output to group chat\n" +
    "!recent  - shows latest markings, optional !recent <num>\n" +
    "!version - shows version history\n```";
    version = null;
    pMsg.author.send(helpMsg);
  });
  return;
}


client.login(config.token);
client.on("ready", () => {
  console.log("Lorebot ready!");
});
