import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: { userId: user.id || user._id },
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected:", newSocket.id);
      setConnected(true);
      setReconnecting(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setConnected(false);
      if (reason === "io server disconnect" || reason === "io client disconnect") {
        setReconnecting(false);
      } else {
        setReconnecting(true);
      }
    });

    newSocket.on("reconnect_attempt", () => {
      setReconnecting(true);
    });

    newSocket.on("reconnect", () => {
      console.log("[Socket] Reconnected successfully");
      setConnected(true);
      setReconnecting(false);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("[Socket] Reconnect failed completely");
      setReconnecting(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected, reconnecting }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
