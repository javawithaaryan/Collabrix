import { Server } from "socket.io";

// In-memory presence map: projectId -> Map<socketId, { name, userId }>
const presence = {};

// Track which project each socket is in (for fast disconnect cleanup)
const socketToProject = {};

const initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
    // Ping timeout/interval for detecting stale connections faster
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.on("connection", (socket) => {
    // ─── Join a project room ───────────────────────────────────────────
    socket.on("join-project", ({ projectId, user }) => {
      if (!projectId || !user) return;

      socket.join(projectId);
      socketToProject[socket.id] = projectId;

      if (!presence[projectId]) {
        presence[projectId] = new Map();
      }

      presence[projectId].set(socket.id, {
        name: user.name || "Someone",
        userId: user.id || user._id,
      });

      socket.to(projectId).emit("presence-status", { name: user.name || "Someone", type: "join" });
      broadcastPresence(io, projectId);
    });

    // ─── Leave a project room explicitly ──────────────────────────────
    socket.on("leave-project", ({ projectId }) => {
      const userData = presence[projectId]?.get(socket.id);
      if (userData) {
        socket.to(projectId).emit("presence-status", { name: userData.name, type: "leave" });
      }
      socket.leave(projectId);
      removeFromPresence(socket.id, projectId);
      broadcastPresence(io, projectId);
      delete socketToProject[socket.id];
    });

    // ─── Task events ──────────────────────────────────────────────────
    // Broadcast a full task payload so clients can update state without refetching
    socket.on("task-created", ({ projectId, task, actorName }) => {
      if (!projectId) return;
      io.to(projectId).emit("task:created", { task });
      io.to(projectId).emit("activity:new", {
        type: "task_created",
        message: `${actorName || "Someone"} created "${task?.title || "a task"}"`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("task-moved", ({ projectId, taskId, newStatus, actorName, taskTitle }) => {
      if (!projectId) return;
      io.to(projectId).emit("task:moved", { taskId, newStatus });
      io.to(projectId).emit("activity:new", {
        type: "task_moved",
        message: `${actorName || "Someone"} moved "${taskTitle || "a task"}" to ${newStatus}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("task-completed", ({ projectId, taskId, actorName, taskTitle }) => {
      if (!projectId) return;
      io.to(projectId).emit("task:moved", { taskId, newStatus: "done" });
      io.to(projectId).emit("activity:new", {
        type: "task_completed",
        message: `${actorName || "Someone"} completed "${taskTitle || "a task"}" ✓`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("tasks-ai-generated", ({ projectId, count, actorName }) => {
      if (!projectId) return;
      // Tell everyone to refetch tasks
      socket.to(projectId).emit("task:bulk-update");
      io.to(projectId).emit("activity:new", {
        type: "ai_generated",
        message: `${actorName || "Someone"} generated ${count || "some"} tasks with AI ✨`,
        timestamp: new Date().toISOString(),
      });
    });

    // Legacy event — kept so old clients don't break during transition
    socket.on("task-updated", ({ projectId, message }) => {
      if (!projectId) return;
      io.to(projectId).emit("receive-task-update");
      if (message) {
        io.to(projectId).emit("activity:new", {
          type: "task_updated",
          message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ─── Comments ─────────────────────────────────────────────────────
    socket.on("task-comment-added", ({ projectId, taskId, comment, actorName, taskTitle }) => {
      if (!projectId || !taskId || !comment) return;
      // Broadcast to other users who have the task details pane open
      socket.to(projectId).emit("comment:new", { taskId, comment });
      io.to(projectId).emit("activity:new", {
        type: "message_sent",
        message: `${actorName || "Someone"} commented on "${taskTitle || "a task"}": "${comment.text.substring(0, 30)}..."`,
        timestamp: new Date().toISOString(),
      });
    });

    // ─── Chat ─────────────────────────────────────────────────────────
    socket.on("send-message", ({ projectId, message }) => {
      if (!projectId || !message) return;
      // Emit to everyone EXCEPT the sender (sender already added optimistically)
      socket.to(projectId).emit("receive-message", message);
    });

    // ─── Typing indicators ────────────────────────────────────────────
    socket.on("typing-start", ({ projectId, userName }) => {
      if (!projectId) return;
      socket.to(projectId).emit("user-typing", { userName, isTyping: true });
    });

    socket.on("typing-stop", ({ projectId, userName }) => {
      if (!projectId) return;
      socket.to(projectId).emit("user-typing", { userName, isTyping: false });
    });

    // ─── Disconnect ───────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      const projectId = socketToProject[socket.id];
      if (projectId) {
        const userData = presence[projectId]?.get(socket.id);
        if (userData) {
          socket.to(projectId).emit("presence-status", { name: userData.name, type: "leave" });
        }
        removeFromPresence(socket.id, projectId);
        broadcastPresence(io, projectId);
        delete socketToProject[socket.id];
      }
    });
  });
};

function broadcastPresence(io, projectId) {
  if (!presence[projectId]) return;
  const users = Array.from(presence[projectId].values()).map((u) => ({ name: u.name }));
  io.to(projectId).emit("online-users", users);
}

function removeFromPresence(socketId, projectId) {
  if (presence[projectId]) {
    presence[projectId].delete(socketId);
    if (presence[projectId].size === 0) {
      delete presence[projectId];
    }
  }
}

export default initSockets;