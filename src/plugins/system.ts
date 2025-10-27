import { command, commands, isPrivate } from "../lib/command";
import config from "../config"
import { readMoreText } from "../utils";
import { exec } from "child_process";

command(
    {
        name: "ping",
        desc: "shows ping of bot",
        usage: `${config.PREFIX}ping`,
        fromMe: isPrivate(),
        react: true,
        type: "info",
    },
    async (msg, match) => {
        const start = Date.now();
        const response = await msg.reply('Measuring ping...'); 
        const end = Date.now();
        await msg.client.sendMessage(msg.jid, {
            text: `Pong! ${end - start}ms`,
            edit: response.key,
        });
    } 
)


command(
  {
    name: "menu",
    desc: "Display all bot commands",
    usage: `${config.PREFIX}menu [category/command]`,
    type: "info",
    fromMe: false,
    react: true
  },
  async (msg, match) => {
    const prefix = config.PREFIX;
    const botName = config.BOT_NAME || "Straw Hat";
    const owner = config.OWNER_NAME || "Captain Haki";
    const readMore = readMoreText();
    const [date, time] = new Date()
      .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      .split(",");

    // Single command info
    if (match) {
      const query = match.toLowerCase();
      const cmd = commands.find(c => c.name?.toLowerCase() === query);
      
      if (cmd) {
        return await msg.reply(
          `\`\`\`╭─── COMMAND INFO ───
│
│ ◉ Name: ${prefix}${cmd.name}
│ ◉ Desc: ${cmd.desc || "No description"}
│ ◉ Usage: ${cmd.usage || "No usage"}
│ ◉ Category: ${cmd.type || "misc"}
│
╰────────────────\`\`\``
        );
      }

      // Category view
      const categoryCommands = commands
        .filter(c => (c.type || "misc").toLowerCase() === query && c.name)
        .map(c => c.name);

      if (categoryCommands.length > 0) {
        let menu = `\`\`\`╭─── ${botName.toUpperCase()} ───
│
│ ◉ Prefix: ${prefix}
│ ◉ Owner: ${owner}
│ ◉ Date: ${date}
│ ◉ Category: ${query.toUpperCase()}
│
╰────────────────\`\`\`\n${readMore}\n\n`;

        menu += `\`\`\`╭─ ${query.toUpperCase()} ───\`\`\`\n`;
        categoryCommands
          .sort((a, b) => a.localeCompare(b))
          .forEach(cmdName => {
            menu += `\`\`\`│ ❯ ${cmdName.trim()}\`\`\`\n`;
          });
        menu += `\`\`\`╰───────────\`\`\`\n\n`;
        menu += `_Powered by Nikka Society_`;

        return await msg.client.sendMessage(msg.jid, {
          image: { url: config.IMG },
          caption: menu
        });
      }

      return await msg.reply(
        `"${query}" not found.\nUse ${prefix}menu to view all.`
      );
    }

    // Full menu
    let menu = `\`\`\`╭─── ${botName.toUpperCase()} ───
│
│ ◉ Prefix: ${prefix}
│ ◉ Owner: ${owner}
│ ◉ Date: ${date}
│ ◉ Commands: ${commands.filter(c => c.name).length}
│
╰────────────────\`\`\`\n${readMore}\n\n`;

    const categories = [...new Set(commands.filter(c => c.name).map(c => c.type || "misc"))].sort();

    categories.forEach(cat => {
      menu += `\`\`\`╭─ ${cat.toUpperCase()} ───\`\`\`\n`;
      commands
        .filter(c => (c.type || "misc") === cat && c.name)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(c => {
          menu += `\`\`\`│ ❯ ${c.name.trim()}\`\`\`\n`;
        });
      menu += `\`\`\`╰───────────\`\`\`\n\n`;
    });

    menu += `_Powered by Nikka Society_`;

   
    return await msg.client.sendMessage(msg.jid, {image: {url: config.IMG}, caption: menu})
  }
);

command(
    {
        name: "gitpull",
        desc: "update bot",
        usage: `${config.PREFIX}update`,
        react: false,
        type: "system",
    },
    async (msg, match) => {
        await msg.reply("_Updating Bot_")
        exec("git pull", (error, stdout, stderr) => {
            msg.reply(stdout || stderr)
            process.exit()
        })
    }
)


command(
    {
        name: "exec",
        desc: "run shell command",
        usage: `${config.PREFIX}exec <command>`,
        react: false,
        type: "system",
    },
    async (msg, match) => {
        if (!match) return await msg.reply("no command provided")
        exec(match, (error, stdout, stderr) => {
            msg.reply(stdout || stderr || "done")
        })
    }
)