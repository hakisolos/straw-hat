"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../lib/command");
const config_1 = __importDefault(require("../config"));
const utils_1 = require("../utils");
const child_process_1 = require("child_process");
(0, command_1.command)({
    name: "ping",
    desc: "shows ping of bot",
    usage: `${config_1.default.PREFIX}ping`,
    fromMe: (0, command_1.isPrivate)(),
    react: true,
    type: "info",
}, async (msg, match) => {
    const start = Date.now();
    const response = await msg.reply('Measuring ping...');
    const end = Date.now();
    await msg.client.sendMessage(msg.jid, {
        text: `Pong! ${end - start}ms`,
        edit: response.key,
    });
});
(0, command_1.command)({
    name: "menu",
    desc: "Display all bot commands",
    usage: `${config_1.default.PREFIX}menu [category/command]`,
    type: "info",
    fromMe: false,
    react: true
}, async (msg, match) => {
    const prefix = config_1.default.PREFIX;
    const botName = config_1.default.BOT_NAME || "Straw Hat";
    const owner = config_1.default.OWNER_NAME || "Captain Haki";
    const readMore = (0, utils_1.readMoreText)();
    const [date, time] = new Date()
        .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        .split(",");
    // Single command info
    if (match) {
        const query = match.toLowerCase();
        const cmd = command_1.commands.find(c => c.name?.toLowerCase() === query);
        if (cmd) {
            return await msg.reply(`\`\`\`╭─── COMMAND INFO ───
│
│ ◉ Name: ${prefix}${cmd.name}
│ ◉ Desc: ${cmd.desc || "No description"}
│ ◉ Usage: ${cmd.usage || "No usage"}
│ ◉ Category: ${cmd.type || "misc"}
│
╰────────────────\`\`\``);
        }
        // Category view
        const categoryCommands = command_1.commands
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
                image: { url: config_1.default.IMG },
                caption: menu
            });
        }
        return await msg.reply(`"${query}" not found.\nUse ${prefix}menu to view all.`);
    }
    // Full menu
    let menu = `\`\`\`╭─── ${botName.toUpperCase()} ───
│
│ ◉ Prefix: ${prefix}
│ ◉ Owner: ${owner}
│ ◉ Date: ${date}
│ ◉ Commands: ${command_1.commands.filter(c => c.name).length}
│
╰────────────────\`\`\`\n${readMore}\n\n`;
    const categories = [...new Set(command_1.commands.filter(c => c.name).map(c => c.type || "misc"))].sort();
    categories.forEach(cat => {
        menu += `\`\`\`╭─ ${cat.toUpperCase()} ───\`\`\`\n`;
        command_1.commands
            .filter(c => (c.type || "misc") === cat && c.name)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(c => {
            menu += `\`\`\`│ ❯ ${c.name.trim()}\`\`\`\n`;
        });
        menu += `\`\`\`╰───────────\`\`\`\n\n`;
    });
    menu += `_Powered by Nikka Society_`;
    return await msg.client.sendMessage(msg.jid, { image: { url: config_1.default.IMG }, caption: menu });
});
(0, command_1.command)({
    name: "gitpull",
    desc: "update bot",
    usage: `${config_1.default.PREFIX}update`,
    react: false,
    type: "system",
}, async (msg, match) => {
    await msg.reply("_Updating Bot_");
    (0, child_process_1.exec)("git pull", (error, stdout, stderr) => {
        msg.reply(stdout || stderr);
        process.exit();
    });
});
(0, command_1.command)({
    name: "exec",
    desc: "run shell command",
    usage: `${config_1.default.PREFIX}exec <command>`,
    react: false,
    type: "system",
}, async (msg, match) => {
    if (!match)
        return await msg.reply("no command provided");
    (0, child_process_1.exec)(match, (error, stdout, stderr) => {
        msg.reply(stdout || stderr || "done");
    });
});
