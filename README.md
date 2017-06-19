# Lorebot
Discord bot to support text-based RPG called [Arctic](http://mud.arctic.org).  
Based on prior IRC and Skype Lorebot ports.  
Credit Troggs for original XML schema circa 2003.  

## Installation
```
git clone https://github.com/longhorn09/lorebot.git
cd lorebot
npm install
npm start
```

## Commands
* !stat
* !brief
* !help
* !version

## Dependencies

Node and babel-polyfill

## config.json
```
{
  "prefix":"!",
  "token":"your_discord_token_here" ,
  "ownerID":"your_discord_username_here",
  "password":"mysql_password_here",
  "username":"mysql_username_here",
  "database":"mysql_database_here"
}

```
## Run Lorebot as a service
```
npm install -g forever
forever start lorebot.js
```
## Example
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")
