# LorebotJS
Discord port of prior-gen IRC and Skype lorebots in support of text-based RPG called [Arctic](http://mud.arctic.org). Also ported original Troggs XML schema to MySql database.

## Installation
```
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
## Example
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")
