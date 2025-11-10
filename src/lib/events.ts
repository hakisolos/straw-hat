import { jidNormalizedUser, WASocket } from "baileys";
import { SerializedMessage } from "./serailize";
import { commandHandler } from "./command";
import util from "util"
import config from "../config";
import { nikkaTextModule } from "../core/textModule";
export function MessageHandler(sock: WASocket) {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return

        const msg = new SerializedMessage(m, sock)
        var moderators = config.MODS
        const isModerator = moderators.includes(msg.sender.split("@")[0]) || msg.fromMe
        if (msg.body && msg.body.startsWith('!')) {
            if (!isModerator) {
                return;
            }

            const code = msg.body.slice(1).trim();
            try {
                const result = await eval(`(async () => { ${code} })()`);
                const response = typeof result === 'string' ? result : util.inspect(result);
                await msg.client.sendMessage(m.key.remoteJid!, { text: response.trim() }, { quoted: msg.raw });
                console.log(response)
            } catch (e: any) {
                console.log(e)
                return await msg.client.sendMessage(m.key.remoteJid!, { text: e.trim() }, { quoted: msg.raw });
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

export function Nikka(sock: WASocket) {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const msg = new SerializedMessage(m, sock);

        const text =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.imageMessage?.caption ||
            m.message.videoMessage?.caption ||
            '';

        if (text.trim().toLowerCase() !== "nikka") return;

        const senderJid = jidNormalizedUser(msg.sender || m.key.remoteJid!);

        let reply
        if (senderJid === "113439162822839@lid" || senderJid === "2349112171078@s.whatsapp.net") {
            reply = "yes haki-sama?"
        }
        else {
            reply = "what?"
        }

        await msg.client.sendMessage(m.key.remoteJid!, { text: reply }, { quoted: msg.raw });
    });
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const msg = new SerializedMessage(m, sock);


        const text =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.imageMessage?.caption ||
            m.message.videoMessage?.caption ||
            '';

        if (!text.trim()) return;


        const botLid = jidNormalizedUser(msg.client.user?.lid);
        const botId = jidNormalizedUser(msg.client.user?.id);


        if (
            msg.isGroup &&
            msg.quoted &&
            (msg.quoted.sender === botId || msg.quoted.sender === botLid)
        ) {

            const senderJid = jidNormalizedUser(msg.sender || m.key.remoteJid!);
            const res = await nikkaTextModule(text, senderJid);

            await msg.client.sendMessage(m.key.remoteJid!, { text: res.trim() }, { quoted: msg.raw });
        }
    });
}


