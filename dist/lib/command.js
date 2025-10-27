"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrivate = exports.commands = void 0;
exports.loadCommands = loadCommands;
exports.commandHandler = commandHandler;
exports.command = command;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const moderators = Array.isArray(config_1.default.MODS) ? config_1.default.MODS : [config_1.default.MODS];
exports.commands = [];
const prefix = config_1.default.PREFIX;
function loadCommands() {
    const pluginsDir = path_1.default.join(process.cwd(), "./src/plugins");
    if (!fs_1.default.existsSync(pluginsDir))
        return;
    const files = fs_1.default.readdirSync(pluginsDir).filter(f => f.endsWith(".js") || f.endsWith(".ts"));
    for (const file of files) {
        const pluginPath = path_1.default.join(pluginsDir, file);
        try {
            require(pluginPath);
            //console.log(`Loaded plugin: ${file}`);
        }
        catch (err) {
            console.error(`Failed to load plugin ${file}:`, err);
        }
    }
}
async function commandHandler(msg) {
    const text = msg.body || "";
    for (const cmd of exports.commands.filter(c => c.on === "text")) {
        try {
            await cmd.execute(msg, text);
        }
        catch (err) {
            console.error(`Error in on:text command (${cmd.name}):`, err);
        }
    }
    if (!text.startsWith(prefix))
        return;
    const parts = text.slice(prefix.length).trim().split(" ");
    const cmdName = parts[0]?.toLowerCase();
    const match = parts.slice(1).join(" ");
    const cmd = exports.commands.find(c => c.name === cmdName && !c.on);
    if (!cmd)
        return;
    const isModerator = moderators.includes(msg.sender?.split("@")[0]) || msg.fromMe;
    if (cmd.fromMe && !isModerator)
        return;
    if (cmd.react)
        await msg.react("⏳");
    try {
        await cmd.execute(msg, match);
    }
    catch (err) {
        console.error(`Error executing command (${cmd.name}):`, err);
    }
    finally {
        if (cmd.react)
            await msg.react("");
    }
}
function command(options, execute) {
    const cmdData = {
        usage: options.usage ?? undefined,
        on: options.on || null,
        ...options,
        execute
    };
    if (options.type)
        exports.commands.push(cmdData);
    return cmdData;
}
const isPrivate = () => config_1.default.MODE === "private";
exports.isPrivate = isPrivate;
