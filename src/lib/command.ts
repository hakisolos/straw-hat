import fs from "fs";
import path from "path";
import config from "../config";

interface CommandOptions {
    name: string;
    desc?: string;
    usage?: string;
    on?: string | null;
    fromMe?: boolean;
    type?: string;
    react?: boolean;
}

interface Command extends CommandOptions {
    execute: (msg: any, match?: string) => Promise<void> | void;
}

const moderators: string[] = Array.isArray(config.MODS) ? config.MODS : [config.MODS];
export const commands: Command[] = [];
const prefix: string = config.PREFIX;

export function loadCommands(): void {
    const pluginsDir = path.join(process.cwd(), "plugins");
    if (!fs.existsSync(pluginsDir)) return;

    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const pluginPath = path.join(pluginsDir, file);
        const pluginUrl = "file://" + pluginPath.replace(/\\/g, "/");
        import(pluginUrl).catch(err => {
            console.error(`Failed to load plugin ${file}:`, err);
        });
    }
}

export async function commandHandler(msg: any): Promise<void> {
    const text = msg.body || "";


    for (const cmd of commands.filter(c => c.on === "text")) {
        try {
            await cmd.execute(msg, text);
        } catch (err) {
            console.error(`Error in on:text command (${cmd.name}):`, err);
        }
    }


    if (!text.startsWith(prefix)) return;

    const parts = text.slice(prefix.length).trim().split(" ");
    const cmdName = parts[0]?.toLowerCase();
    const match = parts.slice(1).join(" ");

    const cmd = commands.find(c => c.name === cmdName && !c.on);
    if (!cmd) return;

    const isModerator =
        moderators.includes(msg.sender?.split("@")[0]) || msg.fromMe;

    if (cmd.fromMe && !isModerator) return;

    if (cmd.react) await msg.react("⏳");

    try {
        await cmd.execute(msg, match);
    } catch (err) {
        console.error(`Error executing command (${cmd.name}):`, err);
    } finally {
        if (cmd.react) await msg.react("");
    }
}

export function command(options: CommandOptions, execute: Command["execute"]): Command {
    const cmdData: Command = {
        usage: options.usage ?? undefined,
        on: options.on || null,
        ...options,
        execute
    };

    if (options.type) commands.push(cmdData);

    return cmdData;
}

export const isPrivate = (): boolean => config.MODE === "private";
