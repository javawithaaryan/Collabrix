import React, { useState } from "react";
import { NavLink, useParams } from "react-router-dom";

import { useWorkspace } from "../../context/WorkspaceContext";
import { workspacePath } from "../../utils/workspaceRoutes";

export default function WorkspaceSidebar() {
  const { id: workspaceId } = useParams();
  const { activeWorkspace, can } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { section: "dashboard", label: "Dashboard", icon: "D", roleRequired: "chat" },
    { section: "projects", label: "Projects", icon: "P", roleRequired: "chat" },
    { section: "kanban", label: "Kanban Board", icon: "K", roleRequired: "chat" },
    { section: "chat", label: "Chat", icon: "C", roleRequired: "chat" },
    { section: "wiki", label: "Wiki", icon: "W", roleRequired: "chat" },
    { section: "resources", label: "Resource Hub", icon: "R", roleRequired: "chat" },
    { section: "settings?tab=members", label: "Team", icon: "T", roleRequired: "chat" },
    { section: "settings", label: "Settings", icon: "S", roleRequired: "manage_invites" },
  ]
    .map((item) => ({ ...item, path: workspacePath(workspaceId, item.section) }))
    .filter((item) => item.path && can(item.roleRequired));

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        height: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
      }}
    >
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
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {navItems.map((item) => (
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
            <span className="text-sm min-w-[24px] flex items-center justify-center font-bold">{item.icon}</span>
            {!collapsed && <span className="ml-3 text-sm tracking-wide">{item.label}</span>}

            {collapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-950 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 shadow-xl border border-slate-800 z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
