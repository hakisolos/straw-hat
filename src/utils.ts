import fs from "fs";
import path from "path";
import axios from "axios";
import { commands } from "./lib/command";
import config from "./config";

const prefix = config.PREFIX;
const envPath = path.resolve(process.cwd(), "config.env");

export function editEnv(key: string, value: string | number): void {
  let envConfig = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const newLine = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");
  
  if (envConfig.match(regex)) {
    envConfig = envConfig.replace(regex, newLine);
  } else {
    envConfig += (envConfig ? "\n" : "") + newLine;
  }
  
  fs.writeFileSync(envPath, envConfig, "utf8");
  process.env[key] = value.toString();
}

fs.watch(envPath, (eventType) => {
  if (eventType === "change") {
    console.log(".env changed! Reloading...");
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach(line => {
      const [k, v] = line.split("=");
      if (k) process.env[k] = v;
    });
    console.log("Updated process.env:", process.env);
  }
});

export function readMoreText(): string {
  return String.fromCharCode(8206).repeat(4001);
}

function getCommandsSummary(): string {
  if (!commands.length) return "No commands available yet.";
  
  return commands.map(c => {
    const usage = c.usage ? `Usage: ${prefix}${c.usage}` : '';
    const desc = c.desc ? ` - ${c.desc}` : '';
    return `• ${prefix}${c.name}${desc} ${usage}`.trim();
  }).join('\n');
}

export function getUptime(): string {
  let totalSeconds = Math.floor(process.uptime());
  let days = Math.floor(totalSeconds / (24 * 60 * 60));
  let hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600);
  let minutes = Math.floor((totalSeconds % 3600) / 60);
  let seconds = totalSeconds % 60;
  
  let result: string[] = [];
  if (days) result.push(`${days}d`);
  if (hours) result.push(`${hours}h`);
  if (minutes) result.push(`${minutes}m`);
  if (seconds) result.push(`${seconds}s`);
  
  return result.join(" ");
}

export async function tts(arg: string, lang: string = "en", msg: any): Promise<void> {
  try {
    if (!arg || typeof arg !== "string") throw new Error("Invalid input");
    
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(arg)}&tl=${lang}&client=tw-ob`;
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/89.0.4389.82 Safari/537.36",
      },
    });
    
    const buff = Buffer.from(response.data);
    await msg.client.sendMessage(
      msg.jid,
      {
        audio: buff,
        mimetype: "audio/mpeg",
        ptt: true,
      },
      { quoted: msg.raw }
    );
  } catch (e) {
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

function base(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

interface IsUrl {
  (url: string): boolean;
  tiktok: (url: string) => boolean;
  youtube: (url: string) => boolean;
  instagram: (url: string) => boolean;
  facebook: (url: string) => boolean;
  x: (url: string) => boolean;
}

export const isUrl: IsUrl = Object.assign(base, {
  tiktok: (url: string) => patterns.tiktok.test(url),
  youtube: (url: string) => patterns.youtube.test(url),
  instagram: (url: string) => patterns.instagram.test(url),
  facebook: (url: string) => patterns.facebook.test(url),
  x: (url: string) => patterns.x.test(url),
});