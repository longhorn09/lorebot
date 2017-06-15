const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
client.login(config.token);

client.on("ready", () => {
  console.log("I am ready!");
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
        console.log(message.author.sendMessage());
        break;
      case "roll":
        message.channel.send(message.author.username
          + " rolled a " + (1 + Math.floor(Math.random() * 6)));
      default:
        break;
    }
    //message.author.sendMessage("Your message here.")
  }
  //if(message.author.id !== config.ownerID) return;
});
