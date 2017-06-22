# lorebot
Lorebot is a Discord bot written in JS to support a text-based RPG called [Arctic](http://mud.arctic.org).  
Lorebot will respond to commands prefixed by the prefix '!' specified in config.json.  
The work is a continuation and port of an original IRC bot started in 2003 by Troggs and a subsequent Skype port.  
Lorebot will also capture lores pasted in Discord chat, either singly or pasted in bulk.  
Lorebot was developed on Ubuntu Linux and is intended to run on Linux.

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
* !version

## Dependencies
```
# NodeJS, a javascript runtime and package manager
sudo apt-get update -y
sudo apt-get install nodejs
sudo apt-get install npm

# MySQL database required
sudo apt-get install mysql-server
sudo mysql_secure_installation

# For timestamp formatting in MySQL format, moment.format("YYYY-MM-DD HH:mm:ss")
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
## Example
```
!stat bronze.shield
```
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")

```
!brief bronze.shield
```
