const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

var isGroupChat = false;
client.login(config.token);
client.on("ready", () => {
  console.log("Lorebot ready!");
});


client.on("message", (message) => {
  let cmd = "";
  if (message.content.startsWith(config.prefix)) {
    cmd = message.content.substring(1,message.content.length);
    //message.channel.send("pong!");
    //console.log("cmd: " + cmd);
    switch(cmd)
    {
      case "test":
        break;
      case "blah":
        message.author.sendMessage("hi " + message.author.username);
        console.log("Sent " + config.prefix + cmd + " to " + message.author.username) ;
        break;
      case "roll":
        message.channel.send(message.author.username
          + " rolled a " + (1 + Math.floor(Math.random() * 6)));
          break;
      case "stat":
        break;
      case "brief":
        break;
      case "mark":
        break;
      case "who":
        break;
      case "recent":        
          break;
      case "gton":
        isGroupChat = true;
        message.channel.send("**Group chat: Enabled");
        break;
      case "gtoff":
        isGroupChat = false;
        message.channel.send("**Group chat: Disabled");
        break;
      case "help":
        const helpStr = "```** IRC Lore Bot v(PLACEHOLDER) (Items: PLACEHOLDER) **\n" +
        "!help    - Lists the different commands available\n" +
        "!stat    - syntax: !stat <item>, example: !stat huma.shield\n" +
        "!brief   - syntax: !brief <item>, example: !brief huma.shield\n" +
        "!mark    - example: !mark kaput rgb cleric, or !mark kaput rgb\n" +
        "!unmark  - unidentifies a character, example: !unmark kaput\n" +
        "!who     - shows character info, example: !who Drunoob\n" +
        "!gton    - turn on output group chat\n" +
        "!gtoff   - turn off output to group chat\n" +
        "!recent  - shows latest markings, optional !recent <num>\n" +
        "!version - shows version history\n```";

        (isGroupChat) ? message.channel.send(helpStr) : message.author.sendMessage(helpStr);
        console.log("Sent " + config.prefix + cmd + " to " + message.author.username) ;
        break;
      default:
        break;
    }
    //message.author.sendMessage("Your message here.")
  }
  //if(message.author.id !== config.ownerID) return;
});
