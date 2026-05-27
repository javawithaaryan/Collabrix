import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../lib/axios";
import Sidebar from "../components/Sidebar";
import Skeleton from "../components/ui/Skeleton";

const PULSE_MESSAGES = [
  "2 teammates online",
  "3 tasks moved today",
  "AI sprint generated",
  "Aryan pushed a commit",
  "Sprint 2 in progress",
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [pulseEvents, setPulseEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pulseIdx, setPulseIdx] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchPulse = async (wsId) => {
    try {
      const res = await api.get(`/pulse/workspace/${wsId}?limit=5`);
      setPulseEvents(res.data.events || []);
    } catch (_) {}
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces");
      setWorkspaces(res.data);
      if (res.data.length > 0) {
        const activeId = localStorage.getItem("activeWorkspaceId") || res.data[0]._id;
        fetchPulse(activeId);
      }
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

  // Cycle through pulse messages
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIdx((i) => (i + 1) % PULSE_MESSAGES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const [lastTask, setLastTask] = useState(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("lastActiveTask");
      if (t) setLastTask(JSON.parse(t));
    } catch (e) {
      console.warn("Failed to load last task:", e.message);
    }
  }, []);

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-10 overflow-y-auto">
        {/* Personalized greeting */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {greeting()}, <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">{user.name || "there"}</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-sm font-sans">Your collaborative workspace is ready. Let's build something.</p>

          {/* Live workspace pulse ticker */}
          <div className="mt-4 inline-flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-900 rounded-full px-4 py-2 text-xs">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-zinc-400 font-mono transition-all duration-500 ease-in-out">
              {PULSE_MESSAGES[pulseIdx]}
            </span>
          </div>
        </div>

        {/* Jump Back In & Active Task Card */}
        {lastTask && (
          <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 mb-8 max-w-4xl flex items-center justify-between group transition duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-950/40 text-violet-400 border border-violet-900/30 flex items-center justify-center text-base select-none group-hover:scale-105 transition">
                ⚡
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider font-mono">Jump Back In</p>
                <h3 className="text-sm font-bold text-white mt-0.5 group-hover:text-violet-300 transition">{lastTask.taskTitle}</h3>
                <p className="text-[9px] text-zinc-600 font-mono mt-0.5">Project: {lastTask.projectId.slice(-6)}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/project/${lastTask.projectId}?task=${lastTask.taskId}`)}
              className="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Open Task →
            </button>
          </div>
        )}

        {/* Main Dashboard Grid layout */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl">
          {/* Workspaces column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Create workspace */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🏗️</span>
                <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">New Workspace</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. Hackathon 2025, Startup MVP, Client Project..."
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                  className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none focus:border-zinc-700 transition text-sm text-white placeholder-zinc-700"
                />
                <button
                  onClick={createWorkspace}
                  disabled={creating || !workspaceName.trim()}
                  className="bg-white text-black px-5 py-3 sm:py-0 rounded-xl font-bold hover:bg-zinc-100 transition disabled:opacity-50 text-xs whitespace-nowrap"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
            </div>

            {/* Workspaces grid */}
            {loading ? (
              <div>
                <h2 className="text-xs font-extrabold text-zinc-550 uppercase tracking-wider mb-4 select-none">
                  Workspaces
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 min-h-[140px] flex flex-col justify-between">
                      <div>
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-4 border-t border-zinc-900">
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
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-10 text-center">
                <span className="text-3xl block mb-4">🚀</span>
                <h3 className="text-base font-bold text-zinc-300 mb-2">Start your first workspace</h3>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
                  A workspace is where your team collaborates. Create one above, then invite teammates, generate sprints with AI, and ship faster.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center max-w-xs mx-auto">
                  {[["✨", "AI Sprints"], ["⚡", "Realtime"], ["💬", "Team Chat"]].map(([icon, label]) => (
                    <div key={label} className="bg-zinc-900/40 border border-zinc-850 rounded-xl py-3 px-2">
                      <span className="block text-lg mb-1">{icon}</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider mb-4">
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

          {/* Teammate Pulse Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-5 hover:border-zinc-800 transition">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Teammate Pulse</h3>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  active
                </span>
              </div>

              {/* Teammates List */}
              <div className="flex flex-col gap-3.5">
                {[
                  { name: "Aryan", role: "Tech Lead", status: "Active in chat", avatar: "A", active: true },
                  { name: "Bhoomi", role: "Frontend Dev", status: "Reviewing tasks", avatar: "B", active: true },
                  { name: "Gemini Copilot", role: "AI Planner", status: "Ready to sequence", avatar: "✨", active: false },
                ].map((peer, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-extrabold text-zinc-300 relative">
                        {peer.avatar}
                        {peer.active && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-black" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">{peer.name}</h4>
                        <p className="text-[9px] text-zinc-500 font-mono">{peer.role}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.5 rounded">
                      {peer.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workspace Highlights Ledger */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 hover:border-zinc-850 transition">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-550 mb-3 select-none font-mono">Recent Pulse</h3>
              <div className="flex flex-col gap-3 font-mono text-[9px]">
                {pulseEvents.length === 0 ? (
                  <p className="text-zinc-600 italic leading-snug">No recent operations logged. Seeding AI sprints or updating boards triggers Pulse timelines.</p>
                ) : (
                  pulseEvents.slice(0, 5).map((item) => {
                    const iconMap = {
                      sprint_generated: "✨",
                      task_moved: "📋",
                      resource_shared: "📚",
                      workspace_created: "📨",
                      milestone_reached: "🎉",
                      temporal_summary: "📈",
                    };
                    const icon = iconMap[item.type] || "⚡";
                    return (
                      <div key={item._id} className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition duration-200">
                        <span className="text-[10px] select-none">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="leading-snug text-zinc-400 truncate">{item.content}</p>
                          <span className="text-zinc-650 text-[8px]">{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
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
              className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[7px] font-extrabold text-zinc-400"
            >
              {String.fromCharCode(65 + i)}
            </span>
          ))}
          {memberCount > 3 && (
            <span className="text-[8px] text-zinc-600 font-mono">+{memberCount - 3}</span>
          )}
        </div>
        <span className="text-[9px] text-zinc-550 font-mono flex items-center gap-1">
          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
          {memberCount} teammate{memberCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export default Dashboard;