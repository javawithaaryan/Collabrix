import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import connectDB from "./db.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-project", (projectId) => {
    socket.join(projectId);

    console.log(`Socket joined project ${projectId}`);
  });

  socket.on("task-updated", (data) => {
    io.to(data.projectId).emit(
      "receive-task-update",
      data
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});