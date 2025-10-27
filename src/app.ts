import { Hono } from "hono";
import {serve} from "@hono/node-server"
import { config } from "dotenv";
import { Client } from "./lib/client";
config()

const app = new Hono()

app.get("/", (c) => {
    return c.text("Hello via flare")
})



serve(app, (info) => {
    Client()
    console.log(`server running on http://localhost:${info.port}`)
})


