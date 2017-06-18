//##############################################################
//# 2017-06-16 - NT - initial creation
//##############################################################
"use strict";
require("babel-polyfill"); //https://babeljs.io/docs/usage/polyfill/
const fs = require('fs');
const path = require('path');
var linecount = 0;
let lineArr = [];
let match = null,
    timeMatch = null;
let column = "";
var obj = "";

const OUTPUT_FILE = path.join(__dirname,'insertion.sql');
const delimiter = "#";
let valuesStr = "",
    colsStr = "",
    colName = "";
//################
//# need to figure out what appropriate sql varchar length is
//################
var foundMax = require('./results.json');
var maxLenTrack = require('./init.json');
var re = new RegExp("^([A-Z].+)=(.+)$");

var regexTime1 = new RegExp("^([0-9]{4})\-([0-9]{1,2})\-([0-9]{1,2}) ([0-9]{1,2})\:([0-9]{1,2})\:([0-9]{1,2})$"); //2017-03-06 02:49:00
var regexTime2 = new RegExp("^([A-Z][a-z]{2}) ([A-Z][a-z]{2}) ([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}) ([0-9]{4})$");   //Thu Sep 25 21:06:49 2003
var regexTime3 = /([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})\s([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\s(AM|PM)/; //3/30/2012 7:59:19 PM


let day = ""  ,
  month = ""  ,
  year = "",
  hour = "",
  minute = "",
  second = "",
  am_pm = "",
  sqlDateStr = "";

//#######################################################
//#
//#######################################################
function getMonthFromString(mon){

   var d = Date.parse(mon + "1, 2012");
   if(!isNaN(d)){
      return new Date(d).getMonth() + 1;
   }
   return -1;
 }

//#######################################################
//# https://stackoverflow.com/questions/8089875/show-a-leading-zero-if-a-number-is-less-than-10
//#######################################################
 function pad(n) {
     return (n < 10) ? ("0" + n) : n;
 }

var rl = require('readline').createInterface({
  input: require('fs').createReadStream('./lores.txt')
});

//console.log(path.join(__dirname,'insertion.sql'));
if (fs.existsSync(OUTPUT_FILE))
{
  fs.unlinkSync(OUTPUT_FILE);
  console.log('successfully deleted ' + OUTPUT_FILE);
}

var GetDBColumn = (arg) => {
  let retvalue = ""
  switch (arg.trim()) {
    case "Object":
      retvalue = "OBJECT_NAME";
      break;
    case "Item Type":
        retvalue = "ITEM_TYPE";
        break;
    case "Item is":
        retvalue = "ITEM_IS";
        break;
    case "Submitter":
    case "Restricts":
    case "Material":
    case "Extra":
    case "Immune":
    case "Class":
    case "Damage":
    case "Speed":
    case "Power":
    case "Affects":
    case "Weight":
    case "Apply":
    case "Effects":
    case "Accuracy":
    case "Charges":
    case "Capacity":
        retvalue = arg.trim().toUpperCase();
        break;
    case "Mat Class":
        retvalue = "mat_class".toUpperCase();
        break;
    case "Value":
        retvalue = "item_value".toUpperCase();
        break;
    case "Time":
        retvalue = "CREATE_DATE";
        break;
    case "Contains":
        retvalue = "CONTAINER_SIZE";
        break;
    case "Level":
        retvalue = "ITEM_LEVEL";
        break;
    default:
      console.log(arg + " NOT FOUND");
      break;
  }
  return retvalue;
};

rl.on('line', line => {
  if (linecount >= 0)
  {
    line = line.trim();                       //get rid of leading/trailing spaces
    lineArr = line.split(delimiter);          //split on delimiter #
    valuesStr = "";
    colsStr = "";
    colName = "";

    for (let i = 0; i < lineArr.length;i++)
    {

      if (re.test(lineArr[i]))
      {
        match = re.exec(lineArr[i]);

        if (match[1] === "Object"){
            obj = match[2];
        }
        if (match[1]==="Time") {
          //console.log(match[2].padEnd(30) + `[${obj}]`);
          regexTime1 = new RegExp("([0-9]{4})\-([0-9]{1,2})\-([0-9]{1,2}) ([0-9]{1,2})\:([0-9]{1,2})\:([0-9]{1,2})");
          //regexTime2 = new RegExp("^([A-Z][a-z]{2}) ([A-Z][a-z]{2}) ([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}) ([0-9]{4})$");
          //regexTime3 = new RegExp(/([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})\s([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})\s(AM|PM)/);

          //################################################################
          //# MySQL datetime format and pad leading zero
          //# https://stackoverflow.com/questions/13984638/what-is-the-correct-datetime-format-for-mysql-database
          //# https://stackoverflow.com/questions/8089875/show-a-leading-zero-if-a-number-is-less-than-10
          //################################################################
          if (regexTime1.test(match[2])) //2017-03-06 02:49:00
          {
            timeMatch = regexTime1.exec(match[2]);  //2017-03-06 02:49:00
            year = timeMatch[1];
            month = timeMatch[2];
            day = timeMatch[3];
            hour = timeMatch[4];
            minute = timeMatch[5];
            second = timeMatch[6];
            sqlDateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            // javascript month in constructor is 0 ~ 11 for Jan thru Dec.
            // https://stackoverflow.com/questions/2280104/convert-javascript-to-date-object-to-mysql-date-format-yyyy-mm-dd
            //console.log((new Date(year,month-1,day,hour,minute,second)).toISOString().substring(0, 19).replace('/T.*/', ' ').padEnd(30) + match[2].padEnd(20) );
          }
          if (regexTime3.test(match[2])) //3/30/2012 7:59:19 PM
          {
            timeMatch = regexTime3.exec(match[2]);
            month = pad(timeMatch[1]);
            day = pad(timeMatch[2]);
            year = timeMatch[3];
            hour = pad(timeMatch[4]);
            minute = pad(Number.parseInt(timeMatch[5]));
            second = timeMatch[6];
            am_pm = timeMatch[7].trim();
            if (am_pm.toUpperCase() === "PM" &&  Number.parseInt(hour) !== 12 )
            {
              hour = Number.parseInt(hour) + 12;
            }
            else if (am_pm.toUpperCase() === "AM" &&  Number.parseInt(hour) == 12 )
            {
              hour = "00";
            }
            sqlDateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
          }
          else if (regexTime2.test(match[2])) { //Thu Sep 25 21:06:49 2003
            timeMatch = regexTime2.exec(match[2]);
            month = pad(getMonthFromString(timeMatch[2]));
            day = pad(Number.parseInt(timeMatch[3]));
            year = timeMatch[7];
            hour = timeMatch[4];
            minute = timeMatch[5];
            second = timeMatch[6];
            sqlDateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
          }


        }

        // build the SQL string
        colsStr +=  GetDBColumn(match[1].trim()) + ",";
        if (match[1]==="Time") {
          sqlDateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
          //console.log(sqlDateStr.padEnd(25) + (sqlDateStr.length).toString().padEnd(5) + match[2]);
          valuesStr += `'${sqlDateStr}',`;//;"'" + year + "',";
        }
        else {
          if (match[1].trim() === "Object" || match[1].trim() === "Extra") {
            valuesStr += "'" + match[2].trim().replace(/\'/g,"''") + "',";   //https://stackoverflow.com/questions/9596652/how-to-escape-apostrophe-in-mysql
          }
          else {
            switch(match[1].trim())
            {
              case "Speed":
              case "Power":
              case "Accuracy":
              case "Charges":
              case "Capacity":
              case "Contains":
              case "Apply":
                valuesStr += match[2].trim() + ",";
                break;
              case "Weight":
                if (match[2].trim().endsWith("kg") ){
                  valueStr += Number.parseInt(match[2].trim().substring(0,2)) + ",";
                }
                else {
                  valuesStr += match[2].trim() + ",";
                }
                break;
              default:
                valuesStr += "'" + match[2].trim() + "',";
                break;
            }

          }
        }



        if (match[2].length > maxLenTrack[match[1]])
        {
          maxLenTrack[match[1]] = match[2].length;

          //# This is solely for determining what the longest one is
          if (match[2].length === foundMax[match[1]]) {
          //  console.log(`${match[1]}:${match[2]} (length: ${match[2].length}) [item: ${obj}]"`);
          }
        }
        //console.log(`${match[1]} : ${match[2]}`);
      }
      else
      {
        console.log("no match: " + lineArr[i] + ", line: " + line)        ;
      }
    } //end for loop

  }
  linecount++;
  colsStr = "INSERT INTO Lore(" + colsStr.substring(0,colsStr.length-1) + ")";
  valuesStr = "VALUES(" + valuesStr.substring(0,valuesStr.length-1) + ");";
  fs.appendFileSync(OUTPUT_FILE,"\n" + colsStr +"\n" + valuesStr);
  //console.log(colsStr);
  //console.log(valuesStr);
}).on('close',() => {
  console.log(`Processed ${linecount} lores`) ;
  console.log(JSON.stringify(maxLenTrack));
  //console.log("foundMax: "+ JSON.stringify(foundMax));
});
