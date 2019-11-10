const Discord = require("discord.js");
const https = require("https");
const client = new Discord.Client();
const auth = require("./auth.json");
//const db =  require('./db');

const demoAPI = "https://lamersbynight.dk/demo/api.php";

let testid = "642381656119836702";
const testROle = "642314842685833226";

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const johnnicodes = client.channels.find(x => x.id == "642308788031979550");
    johnnicodes
        .fetchMessage(testid)
        .then(message => {
            message.reactions.forEach(x => x.fetchUsers());
            console.log("fetched: " + message.id);
            message.edit("React to me :D");
        })
        .catch(console.error);
});

client.on("messageReactionAdd", (reaction, user) => {
    console.log(reaction.message.id);
    if (reaction.message.id == testid) {
        console.log(reaction.emoji.toString());
        if (reaction.emoji.toString() == "<:Morten420:570207250136956929>") {
            console.log("642314842685833226");
            const member = reaction.message.guild.members.find(x => {
                return user.id == x.id;
            });
            if (member) {
                member.addRole(testROle);
            }
        }
    }
});

client.on("messageReactionRemove", (reaction, user) => {
    console.log(reaction.message.id);
    if (reaction.message.id == testid) {
        console.log(reaction.emoji.toString());
        if (reaction.emoji.toString() == "<:Morten420:570207250136956929>") {
            console.log("642314842685833226");
            const member = reaction.message.guild.members.find(x => {
                return user.id == x.id;
            });
            if (member) {
                member.removeRole(testROle);
            }
        }
    }
});

client.on("message", msg => {
    if (msg.channel.name === "johnnicodes") {
        if (msg.content == "!setup") {
            msg.channel.send("React to me :D").then(m => {
                console.log(m.id);
                testid = m.id;
            });
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
                        respons +=
                            "https://lamersbynight.dk/demo/" + element + "\n";
                    });
                    msg.channel.send(respons);
                });
            });
        }
    }
});

client.login(auth.token);
