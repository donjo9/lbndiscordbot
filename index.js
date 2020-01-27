const Discord = require("discord.js");
const https = require("https");
const client = new Discord.Client();
const auth = require("./auth.json");
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

const demoAPI = "https://demo.lamersbynight.dk/api.php";

let msgid = "";

const home = "643338484488339467";
const testROle = "642314842685833226";

/*
const emtest = emojisdb.read().value();

for (let key in emtest) {
  if (emtest.hasOwnProperty(key)) {
    console.log(`${key} : ${emtest[key].role} - ${emtest[key].title}`)
  }
}
*/

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

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
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


      /*
            const msgEmojis = emojisdb.read().value();
            let messages = [];
            if (settingsdb.has("welcome").value()) {
              messages.push(settingsdb.get("welcome").value())
            }
            let emojis = [];
            for (let key in msgEmojis) {
              if (msgEmojis.hasOwnProperty(key)) {
                messages.push(`${key} ${msgEmojis[key].title}`);
                if (msgEmojis[key].id) {
                  emojis.push(msgEmojis[key].id);
                } else {
                  emojis.push(key);
                }
              }
            }
            const newMsg = await msg.channel.send(messages);
            msgid = newMsg.id;
            settingsdb.set("homemsg", msgid).write();
            emojis.forEach(id => newMsg.react(id));
      */
      /*    const reactionFilter = (reaction, user) => {
            if (user.bot) {
              return false;
            }
             msg.channel.send(reaction.emoji.toString());
             console.log(reaction.emoji.toString());
             console.log(reaction.emoji.id);
             console.log(reaction.emoji.identifier);
             msg.react(reaction.emoji.identifier);
             return msg.author.id == user.id;
           }
           const e = await msg.awaitReactions(reactionFilter, {
             time: 30000
           });
    */
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
