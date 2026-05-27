import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

// Attach userId so the server can route personal notifications
function getUserId() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").id || "";
  } catch {
    return "";
  }
}

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  query: { userId: getUserId() },
});

if (import.meta.env.DEV) {
  socket.on("connect", () => console.log("[socket] connected:", socket.id));
  socket.on("disconnect", (reason) => console.log("[socket] disconnected:", reason));
  socket.on("reconnect", (n) => console.log("[socket] reconnected after", n, "attempts"));
  socket.on("reconnect_error", (err) => console.warn("[socket] reconnect error:", err.message));
}

export default socket;