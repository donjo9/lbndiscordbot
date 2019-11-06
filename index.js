const Discord = require('discord.js');
const https = require('https');
const client = new Discord.Client();
const auth = require('./auth.json');

const demoAPI = "https://lamersbynight.dk/demo/api.php";



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content === '!ping') {
        msg.reply('pong');
        console.log(msg.channel.name);
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