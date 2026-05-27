import http from "http";
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import initSockets from "./sockets/index.js";

const PORT = process.env.PORT || 4000;

// Wrap express in an http server so socket.io can share the same port
const server = http.createServer(app);

const io = initSockets(server);
app.set("io", io);

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});