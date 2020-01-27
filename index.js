const Discord = require("discord.js");
const https = require("https");
const client = new Discord.Client();
const auth = require("./auth.json");
const demoinfo = require("./demo.json");
const { stripIndents } = require("common-tags");

const addEmotion = (emoji, id, role, title) => {
  emojisdb.set(emoji, { id: id, role: role, title: title }).write();
};

const nanoid = require("nanoid");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const settingsadapter = new FileSync("settings.json");
const emojiadapter = new FileSync("emoji.json");
const settingsdb = low(settingsadapter);
const emojisdb = low(emojiadapter);


let msgid = "";

const home = "643338484488339467";
const testROle = "642314842685833226";


const adminrole = "481511947481645058";

const updateMessages = async () => {
  if (settingsdb.has("home").value()) {

    const msgEmojis = emojisdb.read().value();
    let messages = [];
    if (settingsdb.has("welcome").value()) {
      messages.push(settingsdb.get("welcome").value())


    }
    let emojis = [];
    for (let key in msgEmojis) {
      if (msgEmojis.hasOwnProperty(key)) {
        messages.push(`${key} ${msgEmojis[key].title}`);
        emojis.push(msgEmojis[key].id);
      }
    }
    const homeChannel = client.channels.find(
      x => x.id == settingsdb.get("home").value()
    );

    if (settingsdb.has("homemsg").value()) {
      msgid = settingsdb.get("homemsg").value();
      homeChannel
        .fetchMessage(msgid)
        .then(message => {
          message.reactions.forEach(reaction => reaction.fetchUsers());
          message.edit(messages);
          emojis.forEach(id => message.react(id));
        })
        .catch(console.error);
    } else {

      const newmsg = await homeChannel.send(messages);
      settingsdb.set("homemsg", newmsg.id).write();
      emojis.forEach(id => newmsg.react(id));
    }



  }
}
let LbNServer = null;
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  LbNServer = client.guilds.find(g => g.id === "357044769446166529")
  try {
    updateMessages();
  } catch (e) {
    console.warn(e);
  }
});

client.on("messageReactionAdd", (reaction, user) => {
  if (user.bot) {
    return;
  }
  if (reaction.message.id == msgid) {
    if (emojisdb.has(reaction.emoji.toString()).value()) {
      const emoji = emojisdb.get(reaction.emoji.toString()).value();
      const member = reaction.message.guild.members.find(x => {
        return user.id == x.id;
      });
      if (member) {
        member.addRole(emoji.role);
      }
    }
  }
});

client.on("messageReactionRemove", (reaction, user) => {
  if (user.bot) {
    return;
  }
  if (reaction.message.id == msgid) {
    if (emojisdb.has(reaction.emoji.toString()).value()) {
      const emoji = emojisdb.get(reaction.emoji.toString()).value();
      const member = reaction.message.guild.members.find(x => {
        return user.id == x.id;
      });
      if (member) {
        member.removeRole(emoji.role);
      }
    }

  }
});

client.on("message", async msg => {
  const member = await msg.guild.members.find(x => x.id == msg.author.id);
  const admin = await member.roles.some(x => x.id === adminrole);

  if (admin) {
    if (msg.content == "!set-home") {
      if (settingsdb.has("home").value()) {
        if (settingsdb.has("homemsg").value()) {

          const oldhome = client.channels.find(x => x.id == settingsdb.get("home").value());
          const oldmsg = await oldhome.fetchMessage(settingsdb.get("homemsg").value());
          settingsdb.unset("homemsg").write();
          oldmsg.delete();
        }
      }
      settingsdb.set("home", msg.channel.id).write();
      await msg.delete();
      updateMessages();
    }
  }
  if (msg.channel.name === "johnnicodes") {
    if (msg.content == "!test-bot") {

   
    } else if (msg.content == "!set-welcome") {
      const setupStarter = msg.author;
      const msgFilter = respons => {
        return respons.author === setupStarter;
      };
      let tempMessages = [msg];
      tempMessages.push(
        await msg.channel.send(stripIndents`
                Hej ${msg.author}
                Skriv en velkomst meddelelse:
                `)
      );

      const m = await msg.channel.awaitMessages(msgFilter, {
        maxMatches: 1,
        time: 30000,
        errors: ["time"]
      });

      const welcome = m.first();

      tempMessages.push(welcome);

      settingsdb.set("welcome", welcome.content).write();
      tempMessages.forEach(x => {
        msg.channel.fetchMessage(x.id).then(async x => {
          await x.delete();
        });
      });
    } else if (msg.content == "!add-reaction") {
      const setupStarter = msg.author;
      const msgFilter = respons => {
        return respons.author === setupStarter;
      };
      const reactionFilter = (reaction, user) => {
        return setupStarter.id == user.id;
      };
      let tempMessages = [msg];
      try {
        tempMessages.push(
          await msg.channel.send(stripIndents`
                Hej ${msg.author}
                Skriv titlen på din reaktion:
                `)
        );

        const m = await msg.channel.awaitMessages(msgFilter, {
          maxMatches: 1,
          time: 30000,
          errors: ["time"]
        });

        const title = m.first();

        tempMessages.push(title);

        const emojiMsg = await msg.channel.send(stripIndents`
                Nu skal du reagere med den ønskede emoji
                `);
        tempMessages.push(emojiMsg);

        const e = await emojiMsg.awaitReactions(reactionFilter, {
          max: 1,
          time: 30000,
          errors: ["time"]
        });
        //console.log(e);
        const reactedEmoji = e.first();

        const availableRoles = msg.channel.guild.roles.map(x => {
          return { name: x.name, id: x.id };
        });

        tempMessages.push(
          await msg.channel.send(
            availableRoles.filter(x => x.name != "@everyone").map(x => x.name)
          )
        );

        tempMessages.push(
          await msg.channel.send(stripIndents`
                Skriv den rolle der skal tildeles`)
        );
        let selectedRole = "";
        const roleFilter = respons => {
          return availableRoles.some(x => {
            if (respons.content.toLowerCase() == x.name.toLowerCase()) {
              selectedRole = x.id;
              return true;
            }
            return false;
          });
        };
        const r = await msg.channel.awaitMessages(roleFilter, {
          maxMatches: 1,
          time: 30000,
          errors: ["time"]
        });

        r.forEach(m => tempMessages.push(m));

        tempMessages.forEach(x => {
          msg.channel.fetchMessage(x.id).then(async x => {
            console.log(x.content);
            await x.delete();
          });
        });
        // msgid = finaleMessage.id;
        console.log(reactedEmoji.emoji.toString());
        addEmotion(reactedEmoji.emoji.toString(), reactedEmoji.emoji.identifier, selectedRole, title.content);

        updateMessages();
      } catch (e) {
        console.log("Error");
        console.log(e);
      }
    }
  }
  if (msg.content === "!ping") {
    msg.reply("pong");
  }

  if (msg.content === "!demo") {
    if (msg.channel.name === "liga" || msg.channel.name === "demo") {
      postDemos(msg.channel)
    }
  }
});

client.login(auth.token);

const express = require('express')
const app = express()
const port = 3000
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '/demo')


const getDemos = async dir => {
    //let demos = [];
    try {
      const demos = await fs.promises.readdir(dir)
      return demos.sort((a, b) => {
        if (a > b) {
            return -1;
        }
        if (a < b) {
            return 1;
        }
        return 0;
    });
    }catch (e){
      console.warn(e);
    }
};

const postDemos = async (channel) => {
  
  const demos = await getDemos(demoinfo.demodir);

  const demoReducer = (string, element) => {
    return string += "https://demo.lbn.gg/" + element + "\n";
  }
  const originDemos = demos.filter(x => x.match(/Origin/g)).reduce(demoReducer,"");
  const legendsDemos = demos.filter(x => x.match(/Legends/g)).reduce(demoReducer,"");

  channel.send("Origins:\n" + originDemos);
  channel.send("Legends:\n" + legendsDemos);
}

app.get('/', async (req, res) => {
    const demos = await getDemos(dir);
    res.send(JSON.stringify(demos));
})

app.post('/updateDemos', async (req, res) => {
  const DemoChannel = LbNServer.channels.find(c => c.id === demoinfo.channelid);
  postDemos(DemoChannel);
  res.send("");
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
                                                                             