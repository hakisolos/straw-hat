import { WASocket } from "baileys";
import { SerializedMessage } from "./serailize";
import { commandHandler } from "./command";
import util from "util"
import config from "../config";

export function MessageHandler(sock: WASocket) {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return

        const msg = new SerializedMessage(m, sock)
        var moderators = config.MODS
        const isModerator = moderators.includes(msg.sender.split("@")[0]) || msg.fromMe
        if (msg.body && msg.body.startsWith('$')) {
            if (!isModerator) {
                return;
            }

            const code = msg.body.slice(1).trim();
            try {
                const result = await eval(`(async () => { ${code} })()`);
                const response = typeof result === 'string' ? result : util.inspect(result);
                await msg.reply(response)
                console.log(response)
            } catch (e: any) {
                console.log(e)
                return await msg.reply(e)
            }

            return;
        }
    })
}
export function logger(sock: WASocket) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return
        const msg = new SerializedMessage(m, sock)
        const msgId = m.key.id
        const chatJid = m.key.remoteJid
        const senderJid = m.key.participant || m.key.remoteJid
        const type = Object.keys(m.message)[0]
        const content =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            ''

        console.log(
            `Message ID   : ${msgId}\n` +
            `Chat JID     : ${chatJid}\n` +
            `Sender JID   : ${senderJid}\n` +
            `Type         : ${type}\n` +
            `Content      : ${content}\n` +
            `fromMe:      : ${msg.fromMe}`
        )
    })
}

export function cmdevent(sock: WASocket) {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return

        const msg = new SerializedMessage(m, sock)
        if (!msg || !msg.body) return

        await commandHandler(msg)
    })
}