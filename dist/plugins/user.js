"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../lib/command");
(0, command_1.command)({
    name: "getpp",
    desc: "Get profile picture",
    fromMe: (0, command_1.isPrivate)(),
    react: true,
    type: "user",
}, async (msg) => {
    let target = msg.quoted?.sender || msg.jid;
    try {
        const ppUrl = await msg.client.profilePictureUrl(target, "image");
        await msg.client.sendMessage(msg.jid, { image: { url: ppUrl } }, { quoted: msg.raw });
    }
    catch {
        await msg.reply("No profile picture found.");
    }
});
