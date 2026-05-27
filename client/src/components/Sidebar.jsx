import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "./notifications/NotificationBell";
import Avatar from "./ui/Avatar";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch (_) {}
  }, []);

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
          <NotificationBell />
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
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-screen transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-900 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Collabrix
            </h1>
            <p className="text-[10px] text-zinc-650 font-mono mt-0.5">Team engineering workspace</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-zinc-550 hover:text-white text-sm p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto scrollbar-thin">
          <NavLink to="/dashboard" icon="📊" label="Dashboard" active={isActive("/dashboard")} />
        </nav>

        {/* Bottom user section */}
        <div className="px-4 pb-5 pt-3 border-t border-zinc-900 flex flex-col gap-3">
          {/* Notification bell (hidden on mobile since it is in the header) */}
          <div className="hidden md:flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">You</span>
            <NotificationBell />
          </div>

          {/* User info */}
          {user.name && (
            <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-900 rounded-xl px-3 py-2.5">
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
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
        active
          ? "bg-zinc-900 text-white border border-zinc-800 shadow"
          : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

export default Sidebar;