import { command } from "../lib/command";

command({
    name: "test",
    desc: "test",
    react: true,
    fromMe: false,
    type: "test"
}, async(msg, match) => {
    if(!match) return await msg.reply("need match")
    await msg.reply(match.trim())
})