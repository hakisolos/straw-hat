"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializedMessage = void 0;
const baileys_1 = require("baileys");
const config_1 = __importDefault(require("../config"));
class SerializedMessage {
    constructor(msg, sock) {
        this.quoted = null;
        if (!msg)
            throw new Error("Message is required");
        this.msg = msg;
        this.sock = sock;
        this.key = msg.key;
        this.jid = msg.key.remoteJid;
        this.id = msg.key.id;
        this.isGroup = this.jid.endsWith("@g.us");
        const jidOwner = (0, baileys_1.jidNormalizedUser)(sock.user?.id);
        const lidOwner = sock.user?.lid ? (0, baileys_1.jidNormalizedUser)(sock.user.lid) : null;
        const rawSender = this.isGroup ? msg.key.participant : this.jid;
        this.sender = (0, baileys_1.jidNormalizedUser)(rawSender || undefined);
        this.fromMe = [jidOwner, lidOwner].includes(this.sender);
        this.senderName = msg.pushName || "Unknown";
        this.pushName = msg.pushName || "Unknown";
        this.client = sock;
        this.user = jidOwner;
        this.prefix = config_1.default.PREFIX;
        const content = msg.message || {};
        this.type = (0, baileys_1.getContentType)(content) || "";
        this.body = this.extractBody(content);
        this.raw = msg;
        this.content = content;
        this.handleQuotedMessage(content, jidOwner, lidOwner);
    }
    extractBody(content) {
        switch ((0, baileys_1.getContentType)(content)) {
            case "conversation":
                return content.conversation;
            case "extendedTextMessage":
                return content.extendedTextMessage?.text;
            case "imageMessage":
                return content.imageMessage?.caption;
            case "videoMessage":
                return content.videoMessage?.caption;
            default:
                return "";
        }
    }
    async handleQuotedMessage(content, jidOwner, lidOwner) {
        const quoted = content?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted)
            return;
        const quotedType = (0, baileys_1.getContentType)(quoted);
        const contextInfo = content?.extendedTextMessage?.contextInfo;
        const rawSender = contextInfo?.participant;
        const quotedSender = (0, baileys_1.jidNormalizedUser)(rawSender);
        const quotedMsg = {
            key: {
                remoteJid: this.jid,
                fromMe: [jidOwner, lidOwner].includes(quotedSender),
                id: contextInfo?.stanzaId,
                participant: quotedSender,
            },
            message: quoted,
        };
        const quotedContent = quotedType ? quoted[quotedType] : undefined;
        this.quoted = {
            type: quotedType,
            content: quotedContent,
            message: quoted,
            sender: quotedSender,
            pushname: quoted?.participant?.pushName || contextInfo?.pushName || "Unknown",
            text: this.extractBody(quoted),
            key: quotedMsg.key,
            isVV: Boolean(quoted?.viewOnceMessageV2 ||
                quoted?.viewOnceMessage ||
                quoted?.imageMessage?.viewOnce ||
                quoted?.videoMessage?.viewOnce),
            raw: quotedMsg,
            download: async () => this.downloadQuotedMedia(quotedType, quotedMsg),
        };
    }
    async downloadQuotedMedia(quotedType, quotedMsg) {
        if (!quotedType ||
            ![
                "imageMessage",
                "videoMessage",
                "audioMessage",
                "stickerMessage",
                "documentMessage",
            ].includes(quotedType)) {
            return null;
        }
        try {
            const customLogger = {
                ...console,
                level: 'info',
                child: () => customLogger
            };
            const buffer = await (0, baileys_1.downloadMediaMessage)(quotedMsg, "buffer", {}, {
                reuploadRequest: this.sock.updateMediaMessage,
                logger: customLogger,
            });
            return buffer;
        }
        catch (err) {
            console.error("Error downloading media:", err);
            return null;
        }
    }
    getMediaExtension(type) {
        switch (type) {
            case "imageMessage":
                return "jpg";
            case "videoMessage":
                return "mp4";
            case "audioMessage":
                return "mp3";
            case "documentMessage":
                return "bin";
            case "stickerMessage":
                return "webp";
            default:
                return "bin";
        }
    }
    async reply(text) {
        return await this.sock.sendMessage(this.key.remoteJid, { text }, { quoted: this.msg });
    }
    async send(text) {
        return await this.sock.sendMessage(this.key.remoteJid, { text });
    }
    async react(emoji) {
        return await this.sock.sendMessage(this.jid, {
            react: { text: emoji, key: this.key },
        });
    }
    async block(jid) {
        return await this.sock.updateBlockStatus(jid, "block");
    }
    async unblock(jid) {
        return await this.sock.updateBlockStatus(jid, "unblock");
    }
    async delete(jid, key) {
        return await this.sock.sendMessage(jid, { delete: key });
    }
}
exports.SerializedMessage = SerializedMessage;
