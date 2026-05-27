import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Avatar from "./ui/Avatar";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch (_) {}
  }, []);

  useEffect(() => {
    const pathParts = location.pathname.split("/");
    if (pathParts[1] === "workspace" && pathParts[2] && /^[a-f\d]{24}$/i.test(pathParts[2])) {
      localStorage.setItem("activeWorkspaceId", pathParts[2]);
      setActiveWorkspaceId(pathParts[2]);
    } else {
      const wsId = localStorage.getItem("activeWorkspaceId");
      if (wsId) setActiveWorkspaceId(wsId);
    }
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Top Header bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-zinc-950/95 border-b border-zinc-900 px-4 flex items-center justify-between z-30 backdrop-blur-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white transition active:scale-95"
          title="Open Menu"
        >
          <span className="text-xl">☰</span>
        </button>
        <span className="text-xs font-black tracking-wider bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase">
          Collabrix
        </span>
        <div className="flex items-center gap-1">
          {/* NotificationBell removed from sidebar */}
        </div>
      </div>

      {/* Dim Overlay when mobile sidebar is active */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-35 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900/80 flex flex-col h-screen transition-transform duration-350 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-indigo-500/20">
                C
              </span>
              <h1 className="text-lg font-black tracking-tight text-zinc-100">
                Collabrix
              </h1>
            </div>
            {activeWorkspaceId ? (
              <Link to="/dashboard" className="text-[10px] text-zinc-500 hover:text-zinc-350 font-mono mt-1.5 inline-flex items-center gap-1 transition-colors">
                <span>←</span> Switch workspace
              </Link>
            ) : (
              <p className="text-[10px] text-zinc-600 font-mono mt-1">Team engineering OS</p>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-zinc-500 hover:text-white text-sm p-1.5 rounded-lg hover:bg-zinc-900 transition"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto scrollbar-thin">
          {activeWorkspaceId ? (
            <>
              {/* Workspace Section */}
              <div className="flex flex-col gap-0.5">
                <span className="px-3 text-[9px] font-bold text-zinc-550 uppercase tracking-widest mb-1.5 font-mono">Workspace</span>
                <NavLink to={`/workspace/${activeWorkspaceId}`} icon="📊" label="Dashboard" active={location.pathname === `/workspace/${activeWorkspaceId}`} />
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/pulse`}
                  icon="⚡"
                  label="Engineer’s Space"
                  active={isActive(`/workspace/${activeWorkspaceId}/pulse`)}
                />
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/resources`}
                  icon="📚"
                  label="Resource Hub"
                  active={isActive(`/workspace/${activeWorkspaceId}/resources`)}
                />
              </div>

              {/* Engineering Section */}
              <div className="flex flex-col gap-0.5">
                <span className="px-3 text-[9px] font-bold text-zinc-550 uppercase tracking-widest mb-1.5 font-mono">Engineering</span>
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/wiki`}
                  icon="📖"
                  label="Wiki"
                  active={isActive(`/workspace/${activeWorkspaceId}/wiki`)}
                />
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/snippets`}
                  icon="💻"
                  label="Snippets"
                  active={isActive(`/workspace/${activeWorkspaceId}/snippets`)}
                />
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/code-review`}
                  icon="🔍"
                  label="Code Review"
                  active={isActive(`/workspace/${activeWorkspaceId}/code-review`)}
                />
              </div>

              {/* Workspace Settings Section */}
              <div className="flex flex-col gap-0.5">
                <span className="px-3 text-[9px] font-bold text-zinc-550 uppercase tracking-widest mb-1.5 font-mono">Settings</span>
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/billing`}
                  icon="💳"
                  label="Billing"
                  active={isActive(`/workspace/${activeWorkspaceId}/billing`)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-0.5">
              <NavLink to="/dashboard" icon="📊" label="Workspaces" active={isActive("/dashboard")} />
            </div>
          )}
        </nav>

        {/* Bottom user section */}
        <div className="px-3 pb-4 pt-3 border-t border-zinc-900 flex flex-col gap-2 bg-zinc-950/40">
          {/* User info */}
          {user.name && (
            <div className="group flex items-center gap-3 bg-zinc-900/25 border border-zinc-900/60 rounded-xl px-3 py-2 transition duration-250 hover:border-zinc-800 hover:bg-zinc-900/40">
              <div className="relative">
                <Avatar alt={user.name} size="sm" showRing={false} />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-zinc-200 truncate group-hover:text-white transition duration-200">{user.name}</p>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>
                <p className="text-[9px] text-zinc-550 truncate font-mono mt-0.5">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full bg-zinc-900/30 hover:bg-rose-950/20 border border-zinc-900/40 hover:border-rose-900/30 transition duration-200 px-3.5 py-2 rounded-xl text-left text-xs text-zinc-500 hover:text-rose-400 font-semibold flex items-center gap-2"
          >
            <span className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Spacer to push page layouts down when mobile top-bar is visible */}
      <div className="md:hidden h-14 w-full flex-shrink-0" />
    </>
  );
};

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group overflow-hidden ${
        active
          ? "bg-zinc-900 text-white border border-zinc-850 shadow-md shadow-black/40 ring-1 ring-white/5 font-semibold"
          : "text-zinc-550 hover:bg-zinc-900/35 hover:text-zinc-200"
      }`}
    >
      {/* Active Left Vertical Accent Line */}
      {active && (
        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-gradient-to-b from-violet-500 to-indigo-500" />
      )}
      <span className={`text-sm transition-transform duration-200 group-hover:scale-110 ${active ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default Sidebar;