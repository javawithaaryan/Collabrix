import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NotificationBell from "./notifications/NotificationBell";
import Avatar from "./ui/Avatar";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState({});

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

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-900 min-h-screen flex flex-col">
      {/* Brand */}
      <div className="px-6 pt-6 pb-4 border-b border-zinc-900">
        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Collabrix
        </h1>
        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">Team engineering workspace</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1.5">
        <NavLink to="/dashboard" icon="📊" label="Dashboard" active={isActive("/dashboard")} />
      </nav>

      {/* Bottom user section */}
      <div className="px-4 pb-5 pt-3 border-t border-zinc-900 flex flex-col gap-3">
        {/* Notification bell */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">You</span>
          <NotificationBell />
        </div>

        {/* User info */}
        {user.name && (
          <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-900 rounded-xl px-3 py-2.5">
            <Avatar alt={user.name} size="sm" showRing={true} ringColor="border-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-200 truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
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
  );
};

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
        active
          ? "bg-zinc-800 text-white border border-zinc-700"
          : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

export default Sidebar;