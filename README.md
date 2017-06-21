# lorebot
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
* !roll
* !version

## Dependencies

Node, babel-polyfill, moment

## Run Lorebot as a service
```
npm install -g forever
forever start lorebot.js
```
## Example
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")
