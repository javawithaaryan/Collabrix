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

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-project", ({ projectId, user }) => {
    socket.join(projectId);

    if (!onlineUsers.has(projectId)) {
      onlineUsers.set(projectId, []);
    }

    const users = onlineUsers.get(projectId);

    const alreadyExists = users.find(
      (u) => u.socketId === socket.id
    );

    if (!alreadyExists) {
      users.push({
        socketId: socket.id,
        name: user.name,
      });
    }

    io.to(projectId).emit(
      "online-users",
      onlineUsers.get(projectId)
    );
  });

  socket.on("task-updated", (data) => {
    io.to(data.projectId).emit(
      "receive-task-update",
      data
    );

    io.to(data.projectId).emit("activity", {
      type: "task",
      message: data.message,
    });
  });

  socket.on("send-message", (data) => {
    io.to(data.projectId).emit(
      "receive-message",
      data
    );

    io.to(data.projectId).emit("activity", {
      type: "message",
      message: data.activity,
    });
  });

  socket.on("disconnect", () => {
    onlineUsers.forEach((users, projectId) => {
      const filteredUsers = users.filter(
        (u) => u.socketId !== socket.id
      );

      onlineUsers.set(projectId, filteredUsers);

      io.to(projectId).emit(
        "online-users",
        filteredUsers
      );
    });

    console.log("User disconnected:", socket.id);
  });
});

connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});