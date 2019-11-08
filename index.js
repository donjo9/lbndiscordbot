const Discord = require('discord.js');
const https = require('https');
const client = new Discord.Client();
const auth = require('./auth.json');
//const db =  require('./db');

const demoAPI = "https://lamersbynight.dk/demo/api.php";

let testid = "";



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageReactionAdd', (reaction, user) => {
    if (reaction.message.id == testid) {
        console.log(reaction.emoji);
        reaction.message.channel.send(reaction.emoji.name);
    }
});

client.on('message', msg => {

    if (msg.channel.name === "johnnicodes") {
        if (msg.content == '!setup') {
            msg.channel.send("React to me :D").then(m => {
                console.log(m.id);
                testid = m.id;
                
            });

        }
    }
    if (msg.content === '!ping') {
        msg.reply('pong');
    }

    if (msg.content === '!demo') {
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
                        respons += "https://lamersbynight.dk/demo/" + element + "\n";
                    });
                    msg.channel.send(respons);
                });
            });

        }
    }
});

client.login(auth.token);