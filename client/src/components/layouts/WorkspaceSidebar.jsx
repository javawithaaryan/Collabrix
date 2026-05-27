import React, { useState } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { useNotifications } from "../../context/NotificationContext";

export default function WorkspaceSidebar() {
  const { id: workspaceId } = useParams();
  const { activeWorkspace, role, can } = useWorkspace();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { path: `/workspace/${workspaceId}/dashboard`, label: "Dashboard", icon: "📊", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/projects`, label: "Projects", icon: "📁", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/kanban`, label: "Kanban Board", icon: "📋", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/tasks`, label: "All Tasks", icon: "☑️", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/chat`, label: "Chat Center", icon: "💬", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/pulse`, label: "Pulse Engine", icon: "⚡", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/wiki`, label: "Wiki Pages", icon: "📖", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/snippets`, label: "Code Snippets", icon: "💻", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/resources`, label: "Resource Hub", icon: "📚", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/sprint-planner`, label: "AI Sprint Planner", icon: "🤖", roleRequired: "create_project" },
    { path: `/workspace/${workspaceId}/code-review`, label: "AI Code Review", icon: "🔍", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/activity`, label: "Pulse Stream", icon: "📈", roleRequired: "chat" },
    { path: `/workspace/${workspaceId}/notifications`, label: "Notifications", icon: "🔔", roleRequired: "chat", badge: unreadCount },
    { path: `/workspace/${workspaceId}/billing`, label: "Billing & Plans", icon: "💳", roleRequired: "delete_workspace" },
    { path: `/workspace/${workspaceId}/settings`, label: "Settings", icon: "⚙️", roleRequired: "manage_invites" },
  ];

  const filteredItems = navItems.filter(item => can(item.roleRequired));

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        height: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"
      }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center space-x-2 truncate">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-500/20">
              {activeWorkspace?.name?.charAt(0).toUpperCase() || "C"}
            </div>
            <span className="font-semibold text-white tracking-wide truncate">
              {activeWorkspace?.name || "Collabrix"}
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-500/20">
            {activeWorkspace?.name?.charAt(0).toUpperCase() || "C"}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all z-20"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-xl transition-all duration-250 group relative ${
                isActive
                  ? "bg-indigo-600/90 text-white font-medium shadow-md shadow-indigo-600/10 border-l-4 border-indigo-400"
                  : "hover:bg-slate-800/60 hover:text-white text-slate-400"
              }`
            }
          >
            <span className="text-lg min-w-[24px] flex items-center justify-center">{item.icon}</span>
            {!collapsed && <span className="ml-3 text-sm tracking-wide">{item.label}</span>}

            {/* Badge Counter */}
            {item.badge > 0 && !collapsed && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-md shadow-red-500/20">
                {item.badge}
              </span>
            )}
            {item.badge > 0 && collapsed && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {item.badge}
              </span>
            )}

            {/* Hover Tooltip when Collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-950 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl border border-slate-800 z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Sidebar Footer / Workspace Switcher */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center px-3 py-2.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-left"
        >
          <span className="text-lg">🔁</span>
          {!collapsed && <span className="ml-3 text-xs font-medium uppercase tracking-wider">Switch Workspace</span>}
        </button>
      </div>
    </aside>
  );
}
