import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../lib/axios";
import socket from "../../socket";

const PRIORITY_DOT = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-zinc-500",
};

const TYPE_ICONS = {
  mention: "🔔",
  task_assigned: "👤",
  task_moved: "→",
  comment: "💬",
  reaction: "❤️",
  invite: "📨",
  sprint_generated: "✨",
  task_created: "＋",
  task_completed: "✓",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const onNewNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnread((prev) => prev + 1);
    };

    socket.on("notification:new", onNewNotif);
    return () => socket.off("notification:new", onNewNotif);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      console.error("Failed to mark all read:", err.message);
    }
  };

  const markRead = async (notif) => {
    if (notif.read) return;
    try {
      await api.put(`/notifications/${notif._id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark read:", err.message);
    }
    if (notif.projectId && onNavigate) {
      onNavigate(notif.projectId, notif.taskId);
    }
  };

  const today = notifications.filter((n) => {
    return new Date(n.createdAt).toDateString() === new Date().toDateString();
  });
  const older = notifications.filter((n) => {
    return new Date(n.createdAt).toDateString() !== new Date().toDateString();
  });

  return (
    <div className="relative" ref={drawerRef}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        className="relative w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition group"
        title="Notifications"
      >
        <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition select-none">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px]">
          <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider">Notifications</h3>
              {unread > 0 && <p className="text-[10px] text-zinc-500 mt-0.5">{unread} unread</p>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition font-bold">
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-4 text-center">
                <span className="text-3xl mb-3 opacity-30">🔔</span>
                <p className="text-zinc-600 text-xs leading-relaxed">
                  When teammates assign tasks, comment, or complete sprints — it shows up here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {today.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[9px] font-extrabold text-zinc-600 uppercase tracking-wider">Today</p>
                    </div>
                    {today.map((n) => <NotifItem key={n._id} notif={n} onRead={markRead} />)}
                  </>
                )}
                {older.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[9px] font-extrabold text-zinc-600 uppercase tracking-wider">Earlier</p>
                    </div>
                    {older.map((n) => <NotifItem key={n._id} notif={n} onRead={markRead} />)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ notif, onRead }) {
  return (
    <button
      onClick={() => onRead(notif)}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-900/40 transition border-b border-zinc-900/40 last:border-0 ${!notif.read ? "bg-zinc-900/20" : ""}`}
    >
      <div className="flex-shrink-0 mt-1.5">
        <span className={`block w-2 h-2 rounded-full ${!notif.read ? (PRIORITY_DOT[notif.priority] || PRIORITY_DOT.medium) : "bg-transparent"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm select-none">{TYPE_ICONS[notif.type] || "•"}</span>
            <p className={`text-[11px] font-bold leading-tight ${notif.read ? "text-zinc-500" : "text-zinc-200"}`}>
              {notif.title}
            </p>
          </div>
          <span className="text-[9px] text-zinc-600 font-mono flex-shrink-0">{timeAgo(notif.createdAt)}</span>
        </div>
        <p className={`text-[10px] mt-0.5 leading-relaxed ${notif.read ? "text-zinc-600" : "text-zinc-400"}`}>
          {notif.message}
        </p>
      </div>
    </button>
  );
}
