import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useSocket } from "../../context/SocketContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import CommandPalette from "./CommandPalette";
import { isObjectId, navigateToWorkspace, workspacePath } from "../../utils/workspaceRoutes";

export default function Topbar() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const { connected, reconnecting } = useSocket();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const notifRef = useRef(null);
  const workspaceRef = useRef(null);
  const profileRef = useRef(null);

  // Keyboard shortcut listener for CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target)) {
        setShowWorkspaceDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleWorkspaceSelect = (id) => {
    switchWorkspace(id);
    navigateToWorkspace(navigate, id);
    setShowWorkspaceDropdown(false);
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif._id);
    setShowNotifDropdown(false);
    
    // Deep linking
    const targetWorkspaceId = isObjectId(notif.workspaceId) ? notif.workspaceId : workspaceId;
    if (notif.projectId && isObjectId(targetWorkspaceId)) {
      let path = workspacePath(targetWorkspaceId, `kanban?project=${notif.projectId}`);
      if (notif.taskId) {
        path += `&task=${notif.taskId}`;
      }
      navigate(path);
    } else if (isObjectId(targetWorkspaceId)) {
      navigate(workspacePath(targetWorkspaceId, "notifications"));
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 text-slate-100 flex items-center justify-between px-6 z-40 backdrop-blur-md sticky top-0">
      {/* Search overlay component */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Reconnecting Sticky Warning Banner */}
      {reconnecting && (
        <div className="absolute top-full left-0 right-0 bg-amber-500 text-slate-950 text-xs py-1.5 px-4 font-bold flex items-center justify-center space-x-2 animate-pulse shadow-md z-30">
          <span>⚠️</span>
          <span>Websocket connection dropped! Attempting to reconnect...</span>
        </div>
      )}

      {/* Left Area: Workspace Selector & Status Indicator */}
      <div className="flex items-center space-x-4">
        <div ref={workspaceRef} className="relative">
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all font-medium text-sm cursor-pointer"
          >
            <span>{activeWorkspace?.name || "Select Workspace"}</span>
            <span className="text-xs text-slate-400">▼</span>
          </button>

          {showWorkspaceDropdown && (
            <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Switch Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => handleWorkspaceSelect(ws._id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all hover:bg-slate-800/80 ${
                    ws._id === workspaceId ? "text-indigo-400 font-semibold bg-indigo-950/20" : "text-slate-300"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  {ws._id === workspaceId && <span className="text-xs">✓</span>}
                </button>
              ))}
              <div className="border-t border-slate-800 my-1"></div>
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setShowWorkspaceDropdown(false);
                }}
                className="w-full flex items-center px-3 py-2 rounded-lg text-left text-xs font-semibold text-slate-400 hover:text-white transition-all hover:bg-slate-800/80"
              >
                ➕ Create or Join Workspace
              </button>
            </div>
          )}
        </div>

        {/* Real-time Connection Indicator */}
        <div className="flex items-center space-x-1.5 bg-slate-800/30 border border-slate-800 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-400">
          <span className={`w-2 h-2 rounded-full relative flex`}>
            {connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
          <span>{connected ? "Realtime Live" : "Offline"}</span>
        </div>
      </div>

      {/* Middle Area: Global CMD+K Search Button */}
      <div className="flex-1 max-w-md mx-6 hidden sm:block">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 transition-all text-slate-500 hover:text-slate-400 text-sm cursor-pointer"
        >
          <span className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Search workspace...</span>
          </span>
          <span className="text-[10px] bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right Area: Notifications bell popover & User Profile */}
      <div className="flex items-center space-x-4">
        {/* Search trigger on mobile */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
        >
          🔍
        </button>

        {/* Notifications Popover Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-750 transition-all cursor-pointer"
          >
            <span>🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg shadow-red-500/20 border-2 border-slate-900 animate-in zoom-in duration-200">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Workspace Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-all"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin space-y-1 mt-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <p>No new notifications</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">We'll alert you of changes</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start p-2.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 border ${
                        notif.read ? "border-transparent bg-transparent" : "border-slate-800 bg-slate-800/10"
                      }`}
                    >
                      <span className="text-base mr-2">{notif.priority === "high" ? "🚨" : "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${notif.read ? "text-slate-400" : "text-slate-200 font-medium"}`}>
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-slate-500 block mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-center ml-2"></span>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-800 pt-2 text-center mt-1">
                <button
                  onClick={() => {
                    const path = workspacePath(workspaceId, "notifications");
                    if (path) navigate(path);
                    setShowNotifDropdown(false);
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-all w-full py-1 rounded hover:bg-slate-800/40"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile details & Logout */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-850 border border-indigo-500/20 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <span className="text-xs font-medium text-slate-300 hidden md:block max-w-[80px] truncate">
              {user?.name}
            </span>
            <span className="text-[10px] text-slate-500 hidden md:block">▼</span>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-2.5 py-1.5 border-b border-slate-800 pb-2">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  const path = workspacePath(workspaceId, "settings");
                  if (path) navigate(path);
                  setShowProfileDropdown(false);
                }}
                className="w-full flex items-center px-2.5 py-2 rounded-lg text-left text-xs text-slate-300 hover:text-white transition-all hover:bg-slate-800/80"
              >
                👤 Profile Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                  setShowProfileDropdown(false);
                }}
                className="w-full flex items-center px-2.5 py-2 rounded-lg text-left text-xs text-red-400 hover:text-red-300 transition-all hover:bg-red-950/20"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
