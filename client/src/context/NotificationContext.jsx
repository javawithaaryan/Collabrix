import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { notificationService } from "../services/notification.service";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { isObjectId, workspacePath } from "../utils/workspaceRoutes";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications initially
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Trigger floating on-screen toast
  const triggerToast = useCallback((message, icon = "⚡", actionLink = null) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, icon, actionLink }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const markAsRead = async (id) => {
    const target = notifications.find((n) => n._id === id);
    if (!target || target.read) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark read:", err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      triggerToast("All notifications marked as read", "✓");
    } catch (err) {
      console.error("Failed to mark all read:", err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // Socket listener for realtime incoming notifications
  useEffect(() => {
    if (!socket) return;

    const onNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 100));
      setUnreadCount((c) => c + 1);
      
      // Configure target routes for deep linking
      let link = null;
      if (notif.projectId && isObjectId(notif.workspaceId)) {
        link = workspacePath(notif.workspaceId, `kanban/${notif.projectId}`);
        if (notif.taskId) {
          link += `?task=${notif.taskId}`;
        }
      }
      triggerToast(notif.message, notif.priority === "high" ? "🚨" : "🔔", link);
    };

    const onTaskCompleted = ({ taskTitle }) => {
      triggerToast(`Task completed: "${taskTitle}"`, "🎉");
    };

    socket.on("notification:new", onNewNotification);
    socket.on("task:completed", onTaskCompleted);

    return () => {
      socket.off("notification:new", onNewNotification);
      socket.off("task:completed", onTaskCompleted);
    };
  }, [socket, triggerToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        toasts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        triggerToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
export default NotificationContext;
