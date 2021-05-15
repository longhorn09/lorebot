# lorebot
Lorebot is a Discord bot written in JS to support a text-based RPG called [Arctic](http://mud.arctic.org).  
The bot will respond to commands prefixed by the prefix '!' specified in config.json.  
The original Lorebot was written in 2003 for IRC by Troggs and subsequently ported to Skype.  
Lorebot will also capture lores pasted in Discord chat, either singly or pasted in bulk.  
Lorebot was developed on Ubuntu Linux and is intended to run on Linux, however it can run on Windows.

## Adding Lorebot
To add Lorebot to your server, simply copy/paste the below into your browser.
```
https://discordapp.com/oauth2/authorize?client_id=318198538611720192&scope=bot&permissions=0
```

## Messaging Lorebot on Discord
Discord is case sensitive so capitalize the B in LoreBot to message and use LoreBot.  
Lorebot can be found on the following Discord server: https://discord.gg/vNuGEpA


```
@LoreBot#2504
```

## Installation
```
git clone https://github.com/longhorn09/lorebot.git
cd lorebot
cp config-sample.json config.json
npm install
npm start
```



## Commands
* `!stat`
* `!brief`
* `!help`
* `!roll`
* `!query`
* `!version`
* `!who`
* `!whoall`
* `!recent`

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

npm install
```

## Run Lorebot as a service

The following will daemonize lorebot.  
This will allow lorebot to continue running even after logging off the terminal.  
It's not required to run lorebot, but highly recommended. 

```
sudo npm install -g forever
forever start lorebot.js
```
## Loading the SQL database

Lorebot uses MySQL on the backend.   
Currently lorebot has over 5,800 lores.   
The easiest way to populate the Lorebot database with lores is to run the following SQL script:  

```./lorebot/sql/load_lorebot_db.sql```

from Linux bash shell

```mysql -u YOUR_USERNAME_HERE -p Lorebot < load_lorebot_db.sql```

The SQL script will populate the `Person` and `Lore` tables.      
You may still need to load the stored procedures as well.  
Relevant scripts for stored procedures can be found in `./lorebot/sql/`

## Permissions and Authentication

Your MySQL username and password that Lorebot uses to query MySQL will be setup in your config.json  
To lookup your various permissions you'll want to visit [https://discordapp.com/developers/applications](https://discordapp.com/developers/applications)

```
{
  "prefix":"!",
  "token":"discord_token_here" ,
  "ownerID":"discord_client_id_here",
  "password":"mysql_password_here",
  "username":"mysql_username_here",
  "database":"Lorebot",
  "channel": "lorebot"
}
```

You'll want to make sure your MySQL privileges correspond with whatever you set in config.json   
Within MySQL:

```
CREATE USER 'mysql_username_here'@'%' IDENTIFIED BY 'mysql_password_here';
GRANT ALL PRIVILEGES ON Lorebot.* TO 'mysql_username_here'@'%';
```

## Bulk loading lores from a text file

For lores accumulated in a plain text file, Lorebot has a utility [load_lores.js](https://github.com/longhorn09/lorebot/blob/master/utility/load_lores.js) to facilitate loading lores into Lorebot.  
Currently the specified lore text file to load is hard-coded near the bottom in [load_lores.js](https://github.com/longhorn09/lorebot/blob/master/utility/load_lores.js) and can be tweaked to suit your needs.  
```const INPUT_FILE = path.join(__dirname,'lores_2016_wipe.txt');```  
This utility will load lores directly from a text file into the MySQL database and bypass Discord parsing.  

## Examples
```
!brief bronze.shield
!stat bronze.shield
```
![Discord Lorebot](/lorebot.PNG?raw=true "Example of brief and stat")


## Troubleshooting

There are typically 2 trouble spots. One is due to the way the SQL script is created, if loading the entire database from the script file, the MySQL database is expecting a user that doesn't exist. To rectify that, use the following

```
GRANT ALL ON *.* TO 'ntang'@'%' IDENTIFIED BY 'complex-password';
FLUSH PRIVILEGES;
```

The other trouble spot relates to the version of Node. The way to resolve this type of issue is to install and use node version manager (https://github.com/creationix/nvm).

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
```


## License
Lorebot is distributed under the [MIT license](https://github.com/longhorn09/lorebot/blob/master/LICENSE.md).
