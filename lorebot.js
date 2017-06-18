"use strict";
require("babel-polyfill"); //https://babeljs.io/docs/usage/polyfill/
const Discord = require("discord.js");
const config = require('./config.json');
const client = new Discord.Client();
var express = require('express');
var router = express.Router();
var path = require('path');
var mysql = require('mysql');
var isGroupChat = false;
const MAX_ITEMS = 3;
const BRIEF_LIMIT = 50;

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
               ,accuracy = null,effects = null,itemIs  = null,charges = null;
  let spell = null; // level
  let restricts = null,immune = null,apply = null,weapClass = null,damage = null;
  let isUpdateSuccess = false;
  let match = null;

  match = (/^Object\s'(.+)'$/).exec(pLore.trim().split("\n")[0].trim());
  objName = match[1];
  console.log(`obj name: ${objName}` + "\n" + `${pLore}`);
  for (let i = 0; i < pLore.split('\n').Length; i++)
  {
    console.log(`[${i}]: ${pLore[i]}`);
  }

}
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

    if (pRows[i].ITEM_TYPE) sb += `Item Type: ${pRows[i].ITEM_TYPE}\n`;
    if (pRows[i].MAT_CLASS) sb += `Mat Class: ${(pRows[i].MAT_CLASS).padEnd(13)}Material : ${pRows[i].MATERIAL}\n`;
    if (pRows[i].WEIGHT) sb +=    `Weight   : ${(pRows[i].WEIGHT.toString()).padEnd(13)}Value    : ${pRows[i].ITEM_VALUE}\n`;
    if (pRows[i].AFFECTS) sb +=   `${formatAffects(pRows[i].AFFECTS)}`;
    if (pRows[i].SPEED) sb +=     `Speed    : ${pRows[i].SPEED}\n`;
    if (pRows[i].POWER) sb +=     `Power    : ${pRows[i].POWER}\n`;
    if (pRows[i].ACCURACY) sb +=  `Accuracy : ${pRows[i].ACCURACY}\n`;
    if (pRows[i].EFFECTS) sb +=   `Effects  : ${pRows[i].EFFECTS}\n`;
    if (pRows[i].ITEM_IS) sb +=   `Item is  : ${pRows[i].ITEM_IS.toUpperCase()}\n`;
    if (pRows[i].CHARGES) sb +=   `Charges  : ${pRows[i].CHARGES}\n`;
    if (pRows[i].ITEM_LEVEL) sb +=`Level    : ${pRows[i].ITEM_LEVEL}\n`;
    if (pRows[i].RESTRICTS) sb += `Restricts: ${pRows[i].RESTRICTS.toUpperCase()}\n`;
    if (pRows[i].IMMUNE) sb +=    `Immune   : ${pRows[i].IMMUNE}\n`;
    if (pRows[i].APPLY) sb +=     `Apply    : ${pRows[i].APPLY}\n`;
    if (pRows[i].CLASS) sb +=     `Class    : ${pRows[i].CLASS}\n`;
    if (pRows[i].DAMAGE) sb +=    `Damage   : ${pRows[i].DAMAGE}\n`;
    if (pRows[i].SUBMITTER) sb += `Submitter: ${pRows[i].SUBMITTER} (${pRows[i].CREATE_DATE})\n`;

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

            formatLore(pMsg,rows) ;
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

            formatBrief(pMsg,rows) ;
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
    whereClause = " WHERE 1=1 "

  if (message.content.trim().length > 6 && message.content.trim().substring(6,7) === " ")
  {
    str = message.content.trim();
    searchItem = (str.substring(6,str.length)).trim().toLowerCase();
    //console.log(searchItem);
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
    whereClause = " WHERE 1=1 "

  if (message.content.trim().length > 5 && message.content.trim().substring(5,6) === " ")
  {
    str = message.content.trim();
    searchItem = (str.substring(5,str.length)).trim().toLowerCase();
    console.log(searchItem);
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
        let helpStr = getHelp();
        (isGroupChat) ? message.channel.send(helpStr) : message.author.send(helpStr);
        console.log("Sent " + config.prefix + cmd + " to " + message.author.username) ;
        break;
      case "version":
        let versionMsg = "** Version unavailable";
        if (typeof process.env.npm_package_version === "string") {
          versionMsg = "** Version " + process.env.npm_package_version ;
        }
        (isGroupChat) ? message.channel.send(versionMsg) : message.author.send(versionMsg);
        break;
      default:
        break;
    }
    //message.author.sendMessage("Your message here.")
  }
  else if ((/^Object\s'(.+)'$/).test(message.content.trim().split("\n")[0].trim()) // fancy regex
        && message.author.username.substring(0,"lorebot".length).toLowerCase() !== "lorebot")
  {
    parseLore(message.author.username,message.content.trim());
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

function getHelp() {
  let version = "(n/a)";
  if (typeof process.env.npm_package_version === "string") {
    version = process.env.npm_package_version ;
  }
  var retvalue = "```** IRC Lore Bot v" + version + " (Items: PLACEHOLDER) **\n" +
  "!help    - Lists the different commands available\n" +
  "!stat    - syntax: !stat <item>, example: !stat huma.shield\n" +
  "!brief   - syntax: !brief <item>, example: !brief huma.shield\n" +
  "!mark    - example: !mark kaput rgb cleric, or !mark kaput rgb\n" +
  "!unmark  - unidentifies a character, example: !unmark kaput\n" +
  "!who     - shows character info, example: !who Drunoob\n" +
  "!gton    - turn on output group chat\n" +
  "!gtoff   - turn off output to group chat\n" +
  "!recent  - shows latest markings, optional !recent <num>\n" +
  "!version - shows version history\n```";
  return retvalue;
}


client.login(config.token);
client.on("ready", () => {
  console.log("Lorebot ready!");
});
