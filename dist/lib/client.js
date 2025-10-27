"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = Client;
const baileys_1 = require("baileys");
const pino_1 = __importDefault(require("pino"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const baileys_2 = require("baileys");
const events_1 = require("./events");
const command_1 = require("./command");
const config_1 = __importDefault(require("../config"));
let sock;
async function Client() {
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)('./session');
    const { version } = await (0, baileys_2.fetchLatestBaileysVersion)();
    sock = (0, baileys_1.makeWASocket)({
        auth: state,
        version,
        logger: (0, pino_1.default)({ level: "silent" }),
        browser: baileys_1.Browsers.macOS("Safari"),
        markOnlineOnConnect: true
    });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
        if (update.qr) {
            qrcode_terminal_1.default.generate(update.qr, { small: true });
        }
        if (update.connection === "close") {
            const reason = update.lastDisconnect?.error?.output?.statusCode;
            reconn(reason);
        }
        else if (update.connection === 'open') {
            console.log('connected successfully');
            console.log(sock.user?.id);
            try {
                if (sock.user?.id) {
                    await sock.sendMessage(`994401499031@s.whatsapp.net`, { text: "Connected successfully" });
                }
                else {
                    console.log('something went wrong, sock not found :)');
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    });
    console.log("installing commands");
    (0, command_1.loadCommands)();
    console.log("commands installed");
    (0, events_1.MessageHandler)(sock);
    (0, events_1.cmdevent)(sock);
    if (config_1.default.LOGGER) {
        (0, events_1.logger)(sock);
    }
    return sock.user;
}
function reconn(reason) {
    if ([baileys_1.DisconnectReason.connectionLost, baileys_1.DisconnectReason.connectionClosed, baileys_1.DisconnectReason.restartRequired].includes(reason)) {
        console.log('Connection lost, reconnecting...');
        Client();
    }
    else {
        console.log(`Disconnected! reason: ${reason}`);
        sock?.end?.(undefined);
    }
}
