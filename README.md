# lorebot
Lorebot is a Discord bot written in JS to support a text-based RPG called [Arctic](http://mud.arctic.org).  
Arctic is like AD&D with only colored text, no graphics.  
Lorebot will respond to commands prefixed by the exclamation mark.  
The work is a continuation and port of prior IRC and Skype lorebots in support of the same text-based game.  
Credit goes to an Arctic player named Troggs for the original XML-based IRC lorebot circa 2003. This bot is simply an evolution of the work started more than a decade ago by Troggs.

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
# Node is required to run Javascript on the server-side
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm

# Used for timestamp formatting in MySQL format, moment.format("YYYY-MM-DD HH:mm:ss")
npm install moment

# Install babel-polyfill to attain ES6+ functionality, primarily used for string.padEnd()
npm install --save babel-polyfill


```

## Run Lorebot as a service

The following will daemonize lorebot.  
This will allow lorebot to continue running even after logging off the terminal.  
It's not required to run lorebot, but highly recommended. 

```
npm install -g forever
forever start lorebot.js
```
## Example
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")
