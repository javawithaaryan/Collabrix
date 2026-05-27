import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = (notif) => {
    markAsRead(notif._id);
    
    // Deep linking logic
    if (notif.projectId) {
      let path = `/workspace/${workspaceId}/kanban?project=${notif.projectId}`;
      if (notif.taskId) {
        path += `&task=${notif.taskId}`;
      }
      navigate(path);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Workspace Notifications
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1">
            Stay up to date with activity, task comments, and board changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-16 text-center">
            <span className="text-4xl block mb-3">🔔</span>
            <h3 className="text-sm font-bold text-slate-350">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              You don't have any unread notifications at the moment. We'll alert you here when changes occur.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start p-4 rounded-2xl border transition duration-150 cursor-pointer ${
                notif.read
                  ? "bg-slate-950/20 border-slate-900 hover:bg-slate-900/10 text-slate-400"
                  : "bg-indigo-950/5 border-indigo-950 hover:bg-indigo-950/10 text-slate-200 shadow-md shadow-indigo-950/5"
              }`}
            >
              <span className="text-xl mr-3 flex-shrink-0 mt-0.5">
                {notif.priority === "high" ? "🚨" : "🔔"}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <p className={`text-xs ${notif.read ? "text-slate-400" : "text-slate-200 font-medium"} leading-relaxed`}>
                    {notif.message}
                  </p>
                  {!notif.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif._id);
                      }}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex-shrink-0 font-mono"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                  <span>
                    {new Date(notif.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {notif.projectId && (
                    <>
                      <span>·</span>
                      <span className="text-indigo-400/80">View Workspace Board →</span>
                    </>
                  )}
                </div>
              </div>

              {!notif.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 self-center ml-4 animate-pulse"></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
