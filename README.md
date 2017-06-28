# lorebot
Lorebot is a Discord bot written in JS to support a text-based RPG called [Arctic](http://mud.arctic.org).  
The bot will respond to commands prefixed by the prefix '!' specified in config.json.  
The original Lorebot was written in 2003 for IRC by Troggs and subsequently ported to Skype.  
Lorebot will also capture lores pasted in Discord chat, either singly or pasted in bulk.  
Lorebot was developed on Ubuntu Linux and is intended to run on Linux.

## Messaging Lorebot on Discord
Discord is case sensitive so capitalize the B in LoreBot to message and use LoreBot.
```
@LoreBot#2504
```

## Installation
```
git clone https://github.com/longhorn09/lorebot.git
cd lorebot
mv config-sample.json config.json
npm install
npm start
```



## Commands
* !stat
* !brief
* !help
* !roll
* !query
* !version
* !who

## Dependencies
```
# NodeJS, a javascript runtime and package manager
sudo apt-get update -y
sudo apt-get install nodejs
sudo apt-get install npm

# MySQL database required
sudo apt-get install mysql-server
sudo mysql_secure_installation

# For timestamp formatting in MySQL format, moment().format("YYYY-MM-DD HH:mm:ss")
npm install moment

# For ES6+ functionality, primarily used for string.padEnd()
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
## Examples
```
!brief bronze.shield
!stat bronze.shield
```
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")

## License
Lorebot is distributed under the MIT license.
