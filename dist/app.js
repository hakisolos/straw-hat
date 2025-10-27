"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const node_server_1 = require("@hono/node-server");
const dotenv_1 = require("dotenv");
const client_1 = require("./lib/client");
(0, dotenv_1.config)();
const app = new hono_1.Hono();
app.get("/", (c) => {
    return c.text("Hello via flare");
});
(0, node_server_1.serve)(app, (info) => {
    (0, client_1.Client)();
    console.log(`server running on http://localhost:${info.port}`);
});
