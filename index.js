const Discord = require("discord.js");
const https = require("https");
const client = new Discord.Client();
const auth = require("./auth.json");
const { stripIndents } = require("common-tags");

const addEmotion = (emoji, role) => {
  emotionsDb.update(
    { emoji: emoji },
    { emoji: emoji, role: role },
    { upsert: true },
    (err, newDOc) => {
      console.log("New doc: ", newDOc);
    }
  );
};

const nanoid = require("nanoid");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const settingsadapter = new FileSync("settings.json");
const emojiadapter = new FileSync("emoji.json");
const settingsdb = low(settingsadapter);
const emojisdb = low(emojiadapter);

const demoAPI = "https://demo.lamersbynight.dk/api.php";

let msgid = "";

const home = "643338484488339467";
const testROle = "642314842685833226";

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  try {
    if (settingsdb.has("home").value()) {
      msgid = settings.msgId;
      console.log(settings);
      const johnnicodes = client.channels.find(
        x => x.id == settingsdb.get("home").value()
      );
      johnnicodes
        .fetchMessage(settings.msgId)
        .then(message => {
          message.reactions.forEach(async x => {
            await x.fetchUsers();
          });
          console.log("fetched: " + message.id);
          message.edit(settings.msgText);
        })
        .catch(console.error);
    }
  } catch (e) {
    console.warn(e);
  }
});

client.on("messageReactionAdd", (reaction, user) => {
  if (user.bot) {
    return;
  }
  if (reaction.message.id == msgid) {
    emotionsDb.findOne({ emoji: reaction.emoji.toString() }, (err, doc) => {
      if (doc) {
        const member = reaction.message.guild.members.find(x => {
          return user.id == x.id;
        });
        if (member) {
          member.addRole(doc.role);
        }
      }
    });
  }
});

client.on("messageReactionRemove", (reaction, user) => {
  if (user.bot) {
    return;
  }
  if (reaction.message.id == msgid) {
    emotionsDb.findOne({ emoji: reaction.emoji.toString() }, (err, doc) => {
      if (doc) {
        const member = reaction.message.guild.members.find(x => {
          return user.id == x.id;
        });
        if (member) {
          member.removeRole(doc.role);
        }
      }
    });
  }
});

client.on("message", async msg => {
  if (msg.channel.name === "johnnicodes") {
    if (msg.content == "!set-welcome") {
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
    } else if (msg.content == "!setup") {
      const setupStarter = msg.author;
      const msgFilter = respons => {
        return respons.author === setupStarter;
      };
      const reactionFilter = (reaction, user) => {
        console.log(user.id, setupStarter.id);
        console.log(setupStarter.id == user.id);
        return setupStarter.id == user.id;
      };
      let tempMessages = [msg];
      try {
        tempMessages.push(
          await msg.channel.send(stripIndents`
                Hello ${msg.author}
                Lets set me up :D
                Please enter the title of your first emition :)
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
                Now lets associate an emoji
                React to this message with the emoji
                `);
        tempMessages.push(emojiMsg);

        const e = await emojiMsg.awaitReactions(reactionFilter, {
          max: 1,
          time: 30000,
          errors: ["time"]
        });
        console.log(e);
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
                Now reply with the role you want to associate`)
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

        const finaleMessage = await msg.channel.send(
          `${reactedEmoji.emoji.toString()} = ${title.content}`
        );
        // - Role: ${msg.channel.guild.roles.find(x => x.id === selectedRole).name}

        finaleMessage.react(reactedEmoji.emoji);
        tempMessages.forEach(x => {
          msg.channel.fetchMessage(x.id).then(async x => {
            console.log(x.content);
            await x.delete();
          });
        });
        msgid = finaleMessage.id;
        settingsDb.update(
          { setupDone: true },
          { $set: { msgId: finaleMessage.id, msgText: finaleMessage.content } },
          {},
          (err, numAffected, affectedDocuments, upsert) => {
            console.log(affectedDocuments);
          }
        );
        addEmotion(reactedEmoji.emoji.toString(), selectedRole);
      } catch (e) {
        console.log(e);
      }
    }
  }
  if (msg.content === "!ping") {
    msg.reply("pong");
  }

  if (msg.content === "!demo") {
    if (msg.channel.name === "liga") {
      https.get(demoAPI, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
          body += data;
        });
        res.on("end", () => {
          body = JSON.parse(body);
          let respons = "";
          body.forEach(element => {
            respons += "https://demo.lamersbynight.dk/" + element + "\n";
          });
          msg.channel.send(respons);
        });
      });
    }
  }
});

client.login(auth.token);
