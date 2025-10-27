"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = MessageHandler;
exports.logger = logger;
exports.cmdevent = cmdevent;
const serailize_1 = require("./serailize");
const command_1 = require("./command");
const util_1 = __importDefault(require("util"));
const config_1 = __importDefault(require("../config"));
function MessageHandler(sock) {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (m.message)
            return;
        const msg = new serailize_1.SerializedMessage(m, sock);
        var moderators = config_1.default.MODS;
        const isModerator = moderators.includes(msg.sender.split("@")[0]) || msg.fromMe;
        if (msg.body && msg.body.startsWith('$')) {
            if (!isModerator) {
                return;
            }
            const code = msg.body.slice(1).trim();
            try {
                const result = await eval(`(async () => { ${code} })()`);
                const response = typeof result === 'string' ? result : util_1.default.inspect(result);
                await msg.reply(response);
                console.log(response);
            }
            catch (e) {
                console.log(e);
                return await msg.reply(e);
            }
            return;
        }
    });
}
function logger(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message)
            return;
        const msgId = m.key.id;
        const chatJid = m.key.remoteJid;
        const senderJid = m.key.participant || m.key.remoteJid;
        const type = Object.keys(m.message)[0];
        const content = m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            '';
        console.log(`Message ID   : ${msgId}\n` +
            `Chat JID     : ${chatJid}\n` +
            `Sender JID   : ${senderJid}\n` +
            `Type         : ${type}\n` +
            `Content      : ${content}\n`);
    });
}
function cmdevent(sock) {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message)
            return;
        const msg = new serailize_1.SerializedMessage(m, sock);
        if (!msg || !msg.body)
            return;
        await (0, command_1.commandHandler)(msg);
    });
}
