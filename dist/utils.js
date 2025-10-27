"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUrl = void 0;
exports.editEnv = editEnv;
exports.readMoreText = readMoreText;
exports.getUptime = getUptime;
exports.tts = tts;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const command_1 = require("./lib/command");
const config_1 = __importDefault(require("./config"));
const prefix = config_1.default.PREFIX;
const envPath = path_1.default.resolve(process.cwd(), "config.env");
function editEnv(key, value) {
    let envConfig = fs_1.default.existsSync(envPath) ? fs_1.default.readFileSync(envPath, "utf8") : "";
    const newLine = `${key}=${value}`;
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (envConfig.match(regex)) {
        envConfig = envConfig.replace(regex, newLine);
    }
    else {
        envConfig += (envConfig ? "\n" : "") + newLine;
    }
    fs_1.default.writeFileSync(envPath, envConfig, "utf8");
    process.env[key] = value.toString();
}
fs_1.default.watch(envPath, (eventType) => {
    if (eventType === "change") {
        console.log(".env changed! Reloading...");
        const envConfig = fs_1.default.readFileSync(envPath, "utf8");
        envConfig.split("\n").forEach(line => {
            const [k, v] = line.split("=");
            if (k)
                process.env[k] = v;
        });
        console.log("Updated process.env:", process.env);
    }
});
function readMoreText() {
    return String.fromCharCode(8206).repeat(4001);
}
function getCommandsSummary() {
    if (!command_1.commands.length)
        return "No commands available yet.";
    return command_1.commands.map(c => {
        const usage = c.usage ? `Usage: ${prefix}${c.usage}` : '';
        const desc = c.desc ? ` - ${c.desc}` : '';
        return `• ${prefix}${c.name}${desc} ${usage}`.trim();
    }).join('\n');
}
function getUptime() {
    let totalSeconds = Math.floor(process.uptime());
    let days = Math.floor(totalSeconds / (24 * 60 * 60));
    let hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let result = [];
    if (days)
        result.push(`${days}d`);
    if (hours)
        result.push(`${hours}h`);
    if (minutes)
        result.push(`${minutes}m`);
    if (seconds)
        result.push(`${seconds}s`);
    return result.join(" ");
}
async function tts(arg, lang = "en", msg) {
    try {
        if (!arg || typeof arg !== "string")
            throw new Error("Invalid input");
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(arg)}&tl=${lang}&client=tw-ob`;
        const response = await axios_1.default.get(url, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.4389.82 Safari/537.36",
            },
        });
        const buff = Buffer.from(response.data);
        await msg.client.sendMessage(msg.jid, {
            audio: buff,
            mimetype: "audio/mpeg",
            ptt: true,
        }, { quoted: msg.raw });
    }
    catch (e) {
        await msg.client.sendMessage(msg.jid, { text: String(e) }, { quoted: msg.raw });
    }
}
const patterns = {
    tiktok: /^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com)\/.+/i,
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
    facebook: /^https?:\/\/(www\.)?facebook\.com\/.+/i,
    x: /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/.+/i,
};
function base(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
exports.isUrl = Object.assign(base, {
    tiktok: (url) => patterns.tiktok.test(url),
    youtube: (url) => patterns.youtube.test(url),
    instagram: (url) => patterns.instagram.test(url),
    facebook: (url) => patterns.facebook.test(url),
    x: (url) => patterns.x.test(url),
});
