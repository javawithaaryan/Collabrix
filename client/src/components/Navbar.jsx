import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Handle Ctrl+K for command palette (placeholder for now)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // Trigger Collabrix AI command palette (Phase 1e)
        console.log("Collabrix AI command palette opened");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-xl font-bold text-white hover:text-slate-100 transition"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span>Collabrix</span>
          </Link>

          {/* Global Navigation */}
          <div className="hidden md:flex items-center space-x-8 ml-12">
            <Link
              to="/dashboard"
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/my-workspaces"
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              My Workspaces
            </Link>
            <Link
              to="/resources"
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              Resource Hub
            </Link>
            <Link
              to="/community"
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              Engineer's Space
            </Link>
            <Link
              to="/insights"
              className="text-slate-300 hover:text-white transition text-sm font-medium"
            >
              Insights
            </Link>
          </div>

          {/* Right Side: Search + User Menu */}
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <div
              className={`hidden md:flex items-center bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 transition ${
                isSearchFocused ? "border-blue-500 shadow-lg shadow-blue-500/20" : ""
              }`}
            >
              <span className="text-slate-500 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search resources, discussions..."
                className="bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none w-48"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <span className="text-slate-600 text-xs ml-2 hidden lg:inline">Ctrl K</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-700">
              <Link
                to="/account"
                className="text-slate-300 hover:text-white transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-slate-300 hover:text-red-400 text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

