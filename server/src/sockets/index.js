import { Server } from "socket.io";

// In-memory presence map: projectId -> Map<socketId, { name, userId }>
const presence = {};
const workspacePresence = {};

// Track which project each socket is in (for fast disconnect cleanup)
const socketToProject = {};
const socketToWorkspace = {};

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
    // Join personal notification room so we can push to specific users
    const userId = socket.handshake.query?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

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

    // Join workspace room for workspace-level events (member joins, invites, etc)
    socket.on("join-workspace", ({ workspaceId, userId, userName }) => {
      if (!workspaceId) return;
      socket.join(`workspace:${workspaceId}`);
      if (userId) socket.join(`user:${userId}`);
      socketToWorkspace[socket.id] = workspaceId;
      if (!workspacePresence[workspaceId]) workspacePresence[workspaceId] = new Map();
      workspacePresence[workspaceId].set(socket.id, {
        userId,
        name: userName || "Someone",
      });
      broadcastWorkspacePresence(io, workspaceId);
    });

    socket.on("leave-workspace", ({ workspaceId }) => {
      if (!workspaceId) return;
      socket.leave(`workspace:${workspaceId}`);
      removeFromWorkspacePresence(socket.id, workspaceId);
      broadcastWorkspacePresence(io, workspaceId);
      delete socketToWorkspace[socket.id];
    });

    // ─── Task events ──────────────────────────────────────────────────
    // Broadcast a full task payload so clients can update state without refetching
    socket.on("task-created", ({ projectId, task, actorName }) => {
      if (!projectId) return;
      io.to(projectId).emit("task:created", { task });
      io.to(projectId).emit("activity:new", {
        type: "task_created",
        message: `${actorName || "Someone"} created "${task?.title || "a task"}"`,
        taskId: task?._id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("task-moved", ({ projectId, taskId, newStatus, actorName, taskTitle }) => {
      if (!projectId) return;
      io.to(projectId).emit("task:moved", { taskId, newStatus });
      io.to(projectId).emit("activity:new", {
        type: "task_moved",
        message: `${actorName || "Someone"} moved "${taskTitle || "a task"}" to ${newStatus}`,
        taskId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("task-completed", ({ projectId, taskId, actorName, taskTitle }) => {
      if (!projectId) return;
      io.to(projectId).emit("task:moved", { taskId, newStatus: "done" });
      io.to(projectId).emit("activity:new", {
        type: "task_completed",
        message: `${actorName || "Someone"} completed "${taskTitle || "a task"}" ✓`,
        taskId,
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
        taskId,
        timestamp: new Date().toISOString(),
      });
    });

    // ─── Chat ─────────────────────────────────────────────────────────
    socket.on("send-message", ({ projectId, message }) => {
      if (!projectId || !message) return;
      // Emit to everyone EXCEPT the sender (sender already added optimistically)
      socket.to(projectId).emit("receive-message", message);
    });

    socket.on("message-reaction", ({ projectId, messageId, message }) => {
      if (!projectId || !messageId) return;
      socket.to(projectId).emit("receive-message-reaction", { messageId, message });
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

    // ─── Live drag presence ───────────────────────────────────────────
    socket.on("task:drag-start", ({ projectId, taskId, actorName, columnId }) => {
      if (!projectId || !taskId) return;
      socket.to(projectId).emit("task:drag-started", { taskId, actorName, columnId });
    });

    socket.on("task:drag-end", ({ projectId, taskId }) => {
      if (!projectId) return;
      socket.to(projectId).emit("task:drag-ended", { taskId });
    });

    // ─── Task viewing presence ────────────────────────────────────────
    socket.on("task:viewing-start", ({ projectId, taskId, userName }) => {
      if (!projectId || !taskId) return;
      socket.to(projectId).emit("task:viewers-updated", { taskId, userName, action: "join" });
    });

    socket.on("task:viewing-stop", ({ projectId, taskId, userName }) => {
      if (!projectId || !taskId) return;
      socket.to(projectId).emit("task:viewers-updated", { taskId, userName, action: "leave" });
    });

    // ─── Task editing presence ────────────────────────────────────────
    socket.on("task:editing-start", ({ projectId, taskId, userName, field }) => {
      if (!projectId || !taskId) return;
      socket.to(projectId).emit("task:editing-updated", { taskId, userName, field, action: "start" });
    });

    socket.on("task:editing-stop", ({ projectId, taskId, userName }) => {
      if (!projectId || !taskId) return;
      socket.to(projectId).emit("task:editing-updated", { taskId, userName, action: "stop" });
    });

    // ─── Disconnect ───────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      const projectId = socketToProject[socket.id];
      if (projectId) {
        const userData = presence[projectId]?.get(socket.id);
        if (userData) {
          socket.to(projectId).emit("presence-status", { name: userData.name, type: "leave" });
          // Clean up any drag or viewing state this socket held
          socket.to(projectId).emit("task:drag-ended", { taskId: null, actorName: userData.name });
          socket.to(projectId).emit("task:viewers-updated", { taskId: null, userName: userData.name, action: "leave" });
        }
        removeFromPresence(socket.id, projectId);
        broadcastPresence(io, projectId);
        delete socketToProject[socket.id];
      }
      const workspaceId = socketToWorkspace[socket.id];
      if (workspaceId) {
        removeFromWorkspacePresence(socket.id, workspaceId);
        broadcastWorkspacePresence(io, workspaceId);
        delete socketToWorkspace[socket.id];
      }
    });
  });
  return io;
};

function broadcastPresence(io, projectId) {
  if (!presence[projectId]) return;
  const users = Array.from(presence[projectId].values()).map((u) => ({ name: u.name, userId: u.userId }));
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

function broadcastWorkspacePresence(io, workspaceId) {
  if (!workspacePresence[workspaceId]) return;
  const users = Array.from(workspacePresence[workspaceId].values()).filter((u) => u.userId);
  io.to(`workspace:${workspaceId}`).emit("workspace-online-users", users);
}

function removeFromWorkspacePresence(socketId, workspaceId) {
  if (workspacePresence[workspaceId]) {
    workspacePresence[workspaceId].delete(socketId);
    if (workspacePresence[workspaceId].size === 0) {
      delete workspacePresence[workspaceId];
    }
  }
}

export default initSockets;