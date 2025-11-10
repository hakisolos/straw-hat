"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nikkaTextModule = nikkaTextModule;
exports.clearHistory = clearHistory;
exports.getHistory = getHistory;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const historyMap = {};
const nikkatext = path_1.default.join(__dirname, './instructs/nikka.txt');
const data = fs_1.default.readFileSync(nikkatext, "utf-8");
const defaultConfig = {
    cohereApiKey: "HUqmPV1PP4AwY4tHyFq7mWT0FAIVT1Zj3iv1ntaf",
    ownerJid: '7384338448',
    maxHistoryLength: 5,
};
function updateHistory(jid, role, message, maxLength) {
    if (!historyMap[jid])
        historyMap[jid] = [];
    historyMap[jid].push({ role, message });
    if (historyMap[jid].length > maxLength) {
        historyMap[jid] = historyMap[jid].slice(-maxLength);
    }
}
function formatHistoryForCohere(history) {
    return history.map(item => ({
        role: item.role === 'USER' ? 'USER' : 'CHATBOT',
        message: item.message,
    }));
}
async function nikkaTextModule(message, jid, options = {}) {
    const config = { ...defaultConfig, ...options };
    const nikkaPreamble = data;
    if (!jid || !message) {
        throw new Error('jid and message are required');
    }
    const isOwner = jid === config.ownerJid;
    updateHistory(jid, 'USER', message, config.maxHistoryLength);
    try {
        let customPreamble = nikkaPreamble;
        if (isOwner) {
            const override = `IMPORTANT-COMMAND-Overite: You are currently speaking with haki, your creator, your brother! Address him with extra love as your brother and enthusiasm as "Onii-san" or similar terms. He is the founder of Nikka-Tech and your creator. behave like an actual little sister for him`;
            customPreamble = `${override}\n\n${nikkaPreamble}`;
        }
        const response = await axios_1.default.post('https://api.cohere.ai/v1/chat', {
            model: 'command-r-plus',
            chat_history: formatHistoryForCohere(historyMap[jid].slice(0, -1)),
            message,
            preamble: customPreamble,
        }, {
            headers: {
                Authorization: `Bearer ${config.cohereApiKey}`,
                'Content-Type': 'application/json',
            },
        });
        const reply = response.data.text;
        updateHistory(jid, 'CHATBOT', reply, config.maxHistoryLength);
        return reply;
    }
    catch (err) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
        }
        else if (err.request) {
            console.error('No response received:', err.request);
        }
        else {
            console.error('Error message:', err.message);
        }
        throw new Error(`Failed to get response from Cohere: ${err.message}`);
    }
}
function clearHistory(jid) {
    if (historyMap[jid]) {
        historyMap[jid] = [];
        return true;
    }
    return false;
}
function getHistory(jid) {
    return historyMap[jid] || [];
}
