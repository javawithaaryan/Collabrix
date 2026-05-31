import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Sparkles, Zap, MessageSquare, Building2, ArrowRight } from "lucide-react";

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
        <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6 max-w-4xl">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
              {greeting()}, {user.name || "there"}
            </h1>
            <p className="text-zinc-400 text-sm">Select a workspace or build a new engineering hub.</p>
          </div>
          <div>
            <NotificationBell />
          </div>
        </div>

        <div className="max-w-4xl flex flex-col gap-8">
          
          {/* Create Workspace Panel */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 focus-within:border-white/30 focus-within:shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">New Workspace</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. Hackathon 2026, Startup MVP, Core Platform..."
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-zinc-400 transition-colors text-sm text-white placeholder-zinc-600 font-sans"
              />
              <button
                onClick={createWorkspace}
                disabled={creating || !workspaceName.trim()}
                className="bg-white text-black px-6 py-3 sm:py-0 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 text-sm whitespace-nowrap active:scale-95"
              >
                {creating ? "Creating..." : "Create Workspace"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          </div>

          {/* Workspaces List */}
          {loading ? (
            <div>
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 select-none font-mono">
                Workspaces
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[140px] flex flex-col justify-between">
                    <div>
                      <Skeleton className="h-5 w-1/2 mb-3 bg-white/10" />
                      <Skeleton className="h-3 w-1/4 bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : workspaces.length === 0 ? (
            /* Empty State */
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-12 text-center max-w-xl mx-auto mt-4 group">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Rocket className="w-8 h-8 text-zinc-400 group-hover:-translate-y-1 transition-transform" />
              </div>
              <h3 className="text-lg font-bold text-zinc-200 mb-2">Start your first workspace</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
                A workspace is where your team collaborates. Create one above, then invite teammates, generate sprints, and ship faster.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center max-w-sm mx-auto">
                {[
                  { icon: Sparkles, label: "AI Sprints" },
                  { icon: Zap, label: "Realtime" },
                  { icon: MessageSquare, label: "Team Chat" }
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-black/40 border border-white/5 rounded-xl py-4 px-2 flex flex-col items-center hover:bg-white/5 transition-colors">
                    <Icon className="w-5 h-5 text-zinc-400 mb-2" />
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">{label}</span>
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

const GLOW_STYLES = [
  "hover:border-violet-500/50 hover:shadow-[0_8px_30px_-12px_rgba(139,92,246,0.2)] via-violet-500",
  "hover:border-emerald-500/50 hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.2)] via-emerald-500",
  "hover:border-amber-500/50 hover:shadow-[0_8px_30px_-12px_rgba(245,158,11,0.2)] via-amber-500",
  "hover:border-blue-500/50 hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.2)] via-blue-500",
  "hover:border-rose-500/50 hover:shadow-[0_8px_30px_-12px_rgba(244,63,94,0.2)] via-rose-500",
];

function WorkspaceCard({ workspace, onClick, colorIndex }) {
  const activeGlow = GLOW_STYLES[colorIndex % GLOW_STYLES.length];
  const memberCount = workspace.members?.length || 1;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 min-h-[140px] flex flex-col justify-between ${activeGlow.split(" ").slice(0,2).join(" ")}`}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-base font-extrabold text-zinc-200 group-hover:text-white transition-colors tracking-tight leading-tight">
            {workspace.name}
          </h2>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
        </div>
        <p className="text-zinc-500 text-xs font-mono">
          ID: {workspace._id.slice(-6)}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between pt-4 mt-4 border-t border-white/5">
        <div className="flex items-center gap-1 select-none">
          {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
            <span
              key={i}
              className="w-5 h-5 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-400"
            >
              {String.fromCharCode(65 + i)}
            </span>
          ))}
        </div>
        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {memberCount} teammate{memberCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className={`absolute -bottom-px inset-x-0 h-px bg-gradient-to-r from-transparent ${activeGlow.split(" ")[2]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    </div>
  );
}

export default Dashboard;