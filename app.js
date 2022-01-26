import { config as envConfig } from 'dotenv';
import { Client as DiscordClient } from 'discord.js';
import * as http from 'http';
import * as iconv from 'iconv-lite';

import { users, commandPrefix, zones, defaultLink, wrongLogsCommandTip } from './configs.js';

envConfig();

const client = new DiscordClient({
  intents: ['GUILDS', 'GUILD_INTEGRATIONS','GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_TYPING', 'DIRECT_MESSAGES'],
  partials: ['MESSAGE', 'REACTION', 'CHANNEL']
});

let msgCounter = 0;

client.on('ready', () => console.log('The Bot is ready!'));

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return false;

  msgCounter++;

  if (!!!(msgCounter % 150)) {
    sendJoke(msg);
  }

  usernameReaction(msg);
  parseCommand(msg);

});

client.login(process.env.BOT_TOKEN);

function usernameReaction(msg) {
  const foundUser = users.find(item => item.names.some((name) => name.toLowerCase() === msg.content.toLowerCase()));

  if (foundUser) {
    msg.react(foundUser.display);
  }
}

function parseCommand(msg) {
  const msgContent = msg.content.trim().split(/ +/g);
  const cmd = msgContent[0].slice(commandPrefix.length).toLowerCase(); // case INsensitive, without prefix
  const args = msgContent.slice(1);

  switch (cmd) {
    case 'логи':
      showLogs(msg, cmd, args);
      break;

    case 'шутка':
      sendJoke(msg);
      break;

    default:
      break;
  }
}

function showLogs(msg, cmd, args) {
  if (!args?.length) {
    msg.channel.send(wrongLogsCommandTip);
    return;
  }

  const username = encodeURI(args[0]);
  const currentZone = args[1] ? zones.find((zone) => zone.names.some((name) => name.toLocaleLowerCase() === args[1].toLowerCase())) : '';
  const currentZoneParam = currentZone ? `#zone=${currentZone.id}` : '';
  const finalLink = defaultLink + username + currentZoneParam;

  msg.channel.send(finalLink);
}

function sendJoke(msg) {
  getJoke().then(joke => joke.forEach((jokeLine) => msg.channel.send(jokeLine)));
}

function getJoke() {
  return new Promise((resolve, reject) => {
    http.get('http://rzhunemogu.ru/RandJSON.aspx?CType=11', (res) => {
      let responseResult;

      res.on('data', (chunk) => responseResult = chunk);

      res.on('end', () => {
        let jokeContent;

        try {
          jokeContent = parseJoke(responseResult).split('\\r\\n');
        } catch (e) {
          jokeContent = ['Слишком кринжовый анекдот'];
        }

        resolve(jokeContent);
      });
    })
  })
}

function decodeJoke(joke) {
  return iconv['default'].decode(joke, 'win1251');
}

function parseJoke(joke) {
  return JSON.parse(decodeJoke(joke).replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t")).content;
}