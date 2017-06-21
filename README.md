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
```
# Node requird to run Javascript on the server-side
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm

# Used for timestamp formatting in MySQL format, moment.format("YYYY-MM-DD HH:mm:ss")
npm install moment

# Install babel-polyfill to attain ES6+ functionality, primarily used for string.padEnd()
npm install --save babel-polyfill


```

## Run Lorebot as a service
```
npm install -g forever
forever start lorebot.js
```
## Example
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")
