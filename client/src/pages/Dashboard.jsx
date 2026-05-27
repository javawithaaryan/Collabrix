import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../lib/axios";
import Sidebar from "../components/Sidebar";
import Skeleton from "../components/ui/Skeleton";
import NotificationBell from "../components/notifications/NotificationBell";

const Dashboard = () => {
  const navigate = useNavigate();

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces");
      setWorkspaces(res.data);
    } catch (err) {
      console.error("Failed to load workspaces:", err.message);
      setError("Could not load workspaces. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/workspaces", { name: workspaceName.trim() });
      setWorkspaceName("");
      setWorkspaces((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error("Failed to create workspace:", err.message);
      setError("Failed to create workspace. Try again.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-10 overflow-y-auto">
        {/* Header with Greeting + Notification Bell */}
        <div className="flex justify-between items-start mb-8 border-b border-zinc-900 pb-6 max-w-4xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👋</span>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {greeting()}, {user.name || "there"}
              </h1>
            </div>
            <p className="text-zinc-550 text-xs font-mono">Select a workspace or build a new engineering hub.</p>
          </div>
          <div>
            <NotificationBell />
          </div>
        </div>

        {/* Main Workspaces Layout */}
        <div className="max-w-4xl flex flex-col gap-8">
          {/* Create workspace */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🏗️</span>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">New Workspace</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. Hackathon 2026, Startup MVP, Core Platform..."
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none focus:border-zinc-700 transition text-sm text-white placeholder-zinc-700 font-sans"
              />
              <button
                onClick={createWorkspace}
                disabled={creating || !workspaceName.trim()}
                className="bg-white text-black px-5 py-3 sm:py-0 rounded-xl font-bold hover:bg-zinc-100 transition disabled:opacity-50 text-xs whitespace-nowrap"
              >
                {creating ? "Creating..." : "Create Workspace"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          </div>

          {/* Workspaces list */}
          {loading ? (
            <div>
              <h2 className="text-xs font-extrabold text-zinc-550 uppercase tracking-wider mb-4 select-none font-mono">
                Workspaces
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 min-h-[140px] flex flex-col justify-between">
                    <div>
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-4 border-t border-zinc-900 font-mono">
                      <div className="flex gap-1">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-10 text-center max-w-xl">
              <span className="text-3xl block mb-4">🚀</span>
              <h3 className="text-base font-bold text-zinc-300 mb-2">Start your first workspace</h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
                A workspace is where your team collaborates. Create one above, then invite teammates, generate sprints with AI, and ship faster.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center max-w-xs mx-auto">
                {[["✨", "AI Sprints"], ["⚡", "Realtime"], ["💬", "Team Chat"]].map(([icon, label]) => (
                  <div key={label} className="bg-zinc-900/40 border border-zinc-850 rounded-xl py-3 px-2">
                    <span className="block text-lg mb-1">{icon}</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 font-mono">
                Workspaces ({workspaces.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {workspaces.map((workspace, idx) => (
                  <WorkspaceCard
                    key={workspace._id}
                    workspace={workspace}
                    onClick={() => navigate(`/workspace/${workspace._id}`)}
                    colorIndex={idx}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ACCENT_COLORS = [
  "from-violet-900/30 to-indigo-900/20 border-violet-800/30 hover:border-violet-750/50",
  "from-emerald-900/20 to-teal-900/20 border-emerald-800/30 hover:border-emerald-750/50",
  "from-amber-900/20 to-orange-900/20 border-amber-800/30 hover:border-amber-750/50",
  "from-blue-900/20 to-cyan-900/20 border-blue-800/30 hover:border-blue-750/50",
  "from-rose-900/20 to-pink-900/20 border-rose-800/30 hover:border-rose-750/50",
];

function WorkspaceCard({ workspace, onClick, colorIndex }) {
  const accent = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
  const memberCount = workspace.members?.length || 1;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-gradient-to-br ${accent} border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/40 flex flex-col justify-between min-h-[140px]`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-sm font-extrabold text-zinc-200 group-hover:text-white transition tracking-tight leading-tight">
            {workspace.name}
          </h2>
          <span className="text-zinc-500 group-hover:text-zinc-300 transition text-sm flex-shrink-0 ml-2">→</span>
        </div>
        <p className="text-zinc-650 text-[9px] font-mono">
          ID: {workspace._id.slice(-6)}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/5">
        <div className="flex items-center gap-1 select-none">
          {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full bg-zinc-850 border border-zinc-700 flex items-center justify-center text-[7px] font-bold text-zinc-400"
            >
              {String.fromCharCode(65 + i)}
            </span>
          ))}
          {memberCount > 3 && (
            <span className="text-[8px] text-zinc-650 font-mono">+{memberCount - 3}</span>
          )}
        </div>
        <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
          {memberCount} teammate{memberCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default Dashboard;