import { Hono } from "hono";
import {serve} from "@hono/node-server"
import { config } from "dotenv";
import { Client } from "./lib/client";
config()

const app = new Hono()
const user = Client()
app.get("/", (c) => {
    return c.json(user)
})



serve(app, (info) => {
    
    console.log(`server running on http://localhost:${info.port}`)
})


