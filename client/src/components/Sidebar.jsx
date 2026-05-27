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
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900/90 flex flex-col h-screen transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-900 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent animate-pulse">
              Collabrix
            </h1>
            {activeWorkspaceId ? (
              <Link to="/dashboard" className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono mt-0.5 block">
                ← Switch workspace
              </Link>
            ) : (
              <p className="text-[10px] text-zinc-650 font-mono mt-0.5">Team engineering workspace</p>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-zinc-550 hover:text-white text-sm p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
          {activeWorkspaceId ? (
            <>
              {/* Workspace Section */}
              <div className="flex flex-col gap-1">
                <span className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 font-mono">Workspace</span>
                <NavLink to={`/workspace/${activeWorkspaceId}`} icon="📊" label="Dashboard" active={location.pathname === `/workspace/${activeWorkspaceId}`} />
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/pulse`}
                  icon="⚡"
                  label="Engineering Space"
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
              <div className="flex flex-col gap-1">
                <span className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 font-mono">Engineering</span>
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
              <div className="flex flex-col gap-1">
                <span className="px-3 text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1 font-mono">Workspace Settings</span>
                <NavLink
                  to={`/workspace/${activeWorkspaceId}/billing`}
                  icon="💳"
                  label="Billing"
                  active={isActive(`/workspace/${activeWorkspaceId}/billing`)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <NavLink to="/dashboard" icon="📊" label="Workspaces" active={isActive("/dashboard")} />
            </div>
          )}
        </nav>

        {/* Bottom user section */}
        <div className="px-4 pb-5 pt-3 border-t border-zinc-900 flex flex-col gap-3">
          <div className="hidden md:flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Profile</span>
          </div>

          {/* User info */}
          {user.name && (
            <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-900 rounded-xl px-3 py-2.5 hover:border-zinc-800 transition">
              <Avatar alt={user.name} size="sm" showRing={true} ringColor="border-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-650 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full bg-zinc-900/50 hover:bg-red-950/30 border border-zinc-900 hover:border-red-900/40 transition px-4 py-2.5 rounded-xl text-left text-xs text-zinc-500 hover:text-red-400 font-bold flex items-center gap-2.5"
          >
            <span className="text-sm">🚪</span> Sign out
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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
        active
          ? "bg-zinc-900 text-white border border-zinc-800 shadow-lg shadow-black/40 ring-1 ring-white/5"
          : "text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300"
      }`}
    >
      <span className="text-sm">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default Sidebar;