"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const dotenv_1 = require("dotenv");
const client_1 = require("./lib/client");
(0, dotenv_1.config)();
const app = new hono_1.Hono();
const user = (0, client_1.Client)();
app.get("/", (c) => {
    return c.json(user);
});
(0, node_server_1.serve)(app, (info) => {
    console.log(`server running on http://localhost:${info.port}`);
});
