import {
    useMultiFileAuthState,
    delay,
    Browsers,
    WASocket,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    makeWASocket,
} from 'baileys';
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from 'fs'
import qrcode from 'qrcode-terminal'

import { MessageHandler, cmdevent, logger } from "./events";
import { loadCommands } from "./command";
import config from "../config";
let sock: WASocket;
export async function Client() {
    const {state, saveCreds} = await useMultiFileAuthState('./session')
    
   
    sock = makeWASocket({
        auth: state,
        logger: pino({level: "silent"}),
        browser: Browsers.macOS("Safari"),
        markOnlineOnConnect: true
    })
    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async(update) => {
        if(update.qr) {
            qrcode.generate(update.qr, {small: true})
        }
        if(update.connection === "close") {
            const reason = (update.lastDisconnect?.error as Boom<any>)?.output?.statusCode;
            reconn(reason)

        }
        else if(update.connection === 'open') {
            console.log('connected successfully')
            console.log(sock.user?.id)
            try{
                if (sock.user?.id) {
                    await sock.sendMessage(sock.user.id, {text: "Connected successfully"})
                }else{
                    console.log('something went wrong, sock not found :)')
                }
            }catch(e) {
                console.log(e)
            }
        }
    })
    console.log("installing commands")
    loadCommands()
    console.log("commands installed")

    MessageHandler(sock)
    cmdevent(sock)
    if(config.LOGGER) {
        logger(sock)
    }

    
}

function reconn(reason: any) {
    if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired].includes(reason)) {
        console.log('Connection lost, reconnecting...');
        Client();
    } else {
        console.log(`Disconnected! reason: ${reason}`);
        sock?.end?.(undefined);
    }
}