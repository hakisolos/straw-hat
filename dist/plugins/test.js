"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../lib/command");
(0, command_1.command)({
    name: "test",
    desc: "test",
    react: true,
    fromMe: true,
    type: "test"
}, async (msg, match) => {
    if (!match)
        return await msg.reply("need match");
    await msg.reply(match.trim());
});
