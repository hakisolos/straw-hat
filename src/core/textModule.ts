import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../config';

interface HistoryItem {
    role: 'USER' | 'CHATBOT';
    message: string;
}

interface Config {
    cohereApiKey: string;
    ownerJid: any;
    maxHistoryLength: number;
}

interface NikkaOptions {
    cohereApiKey?: string;
    ownerJid?: any;
    maxHistoryLength?: number;
}

const historyMap: Record<string, HistoryItem[]> = {};

const nikkatext = path.join(__dirname, './instructs/nikka.txt');
const data = fs.readFileSync(nikkatext, "utf-8");

const defaultConfig: Config = {
    cohereApiKey: "HUqmPV1PP4AwY4tHyFq7mWT0FAIVT1Zj3iv1ntaf",
    ownerJid: config.MODS,
    maxHistoryLength: 5,
};

function updateHistory(jid: string, role: HistoryItem['role'], message: string, maxLength: number) {
    if (!historyMap[jid]) historyMap[jid] = [];
    historyMap[jid].push({ role, message });
    if (historyMap[jid].length > maxLength) {
        historyMap[jid] = historyMap[jid].slice(-maxLength);
    }
}

function formatHistoryForCohere(history: HistoryItem[]) {
    return history.map(item => ({
        role: item.role === 'USER' ? 'USER' : 'CHATBOT',
        message: item.message,
    }));
}

export async function nikkaTextModule(message: string, jid: string, options: NikkaOptions = {}): Promise<string> {
    const cnf: Config = { ...defaultConfig, ...options };
    const nikkaPreamble = data;

    if (!jid || !message) {
        throw new Error('jid and message are required');
    }

    const isOwner = jid === "2349112171078@s.whatsapp.net" || jid === "113439162822839@lid"
    updateHistory(jid, 'USER', message, cnf.maxHistoryLength);

    try {
        let customPreamble = nikkaPreamble;
        if (isOwner) {
            const override = `IMPORTANT-COMMAND-Overite: You are currently speaking with haki, your creator, your master! Address him with extra love as your brother and enthusiasm as "Onii-samma or haki samma" or similar terms. He is the founder of Nikka-Tech and your creator. behave like an actual little sister for him`;
            customPreamble = `${override}\n\n${nikkaPreamble}`;
        }

        const response = await axios.post(
            'https://api.cohere.ai/v1/chat',
            {
                model: 'command-r-plus-08-2024',
                chat_history: formatHistoryForCohere(historyMap[jid].slice(0, -1)),
                message,
                preamble: customPreamble,
            },
            {
                headers: {
                    Authorization: `Bearer ${cnf.cohereApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const raw = response.data.text ?? response.data.message ?? '';
        const reply = typeof raw === 'string' ? raw : JSON.stringify(raw);
        updateHistory(jid, 'CHATBOT', reply, cnf.maxHistoryLength);
        return reply;
    } catch (err: any) {
        if (err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
        } else if (err.request) {
            console.error('No response received:', err.request);
        } else {
            console.error('Error message:', err.message);
        }
        throw new Error(`Failed to get response from Cohere: ${err.message}`);
    }
}

export function clearHistory(jid: string): boolean {
    if (historyMap[jid]) {
        historyMap[jid] = [];
        return true;
    }
    return false;
}

export function getHistory(jid: string): HistoryItem[] {
    return historyMap[jid] || [];
}
