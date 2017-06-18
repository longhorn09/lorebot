# LorebotJS
Port of prior-gen IRC and Skype lorebots in support of Arctic text-based RPG. Also ported original Troggs XML schema to MySql database.

## Installation 
```
npm install
npm start
```

## Commands
!stat
!brief
!help
!version

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
