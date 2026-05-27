import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import api from "../lib/axios";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MemberPanel from "../components/workspace/MemberPanel";
import Avatar from "../components/ui/Avatar";
import NotificationBell from "../components/notifications/NotificationBell";

const PROJECT_COLORS = [
  "from-violet-900/30 to-indigo-900/20 border-violet-850/40 hover:border-violet-700/60 shadow-lg shadow-violet-950/10",
  "from-emerald-900/20 to-teal-900/20 border-emerald-850/40 hover:border-emerald-700/60 shadow-lg shadow-emerald-950/10",
  "from-amber-900/20 to-orange-900/20 border-amber-850/40 hover:border-amber-700/60 shadow-lg shadow-amber-950/10",
  "from-blue-900/20 to-cyan-900/20 border-blue-850/40 hover:border-blue-700/60 shadow-lg shadow-blue-950/10",
  "from-rose-900/20 to-pink-900/20 border-rose-850/40 hover:border-rose-700/60 shadow-lg shadow-rose-950/10",
];

const Workspace = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pulseEvents, setPulseEvents] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastTask, setLastTask] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = useCallback(async () => {
    try {
      const [wsRes, projRes, tasksRes, pulseRes] = await Promise.all([
        api.get(`/workspaces/${id}`),
        api.get(`/projects/${id}`),
        api.get(`/tasks/workspace/${id}`),
        api.get(`/pulse/workspace/${id}?limit=5`),
      ]);
      setWorkspace(wsRes.data);
      setProjects(projRes.data);
      setTasks(tasksRes.data || []);
      setPulseEvents(pulseRes.data?.events || []);
    } catch (err) {
      console.error("Failed to load workspace data:", err.message);
      setError("Could not load workspace. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();

    // Join workspace socket room for live presence
    if (!socket.connected) socket.connect();
    socket.emit("join-workspace", { workspaceId: id, userId: user.id, userName: user.name });

    const onOnlineUsers = (users) => setOnlineUsers(users);
    const onPulseNew = (event) => setPulseEvents((prev) => [event, ...prev].slice(0, 5));
    const onMemberJoined = ({ member }) => {
      setPulseEvents((prev) => [
        {
          _id: `join-${Date.now()}`,
          type: "workspace_created",
          content: `${member?.name || "A teammate"} joined the workspace as ${member?.role || "member"}`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 5));
    };

    socket.on("workspace-online-users", onOnlineUsers);
    socket.on("pulse:new", onPulseNew);
    socket.on("workspace:member-joined", onMemberJoined);

    try {
      const t = localStorage.getItem("lastActiveTask");
      if (t) setLastTask(JSON.parse(t));
    } catch (_) {}

    return () => {
      socket.emit("leave-workspace", { workspaceId: id });
      socket.off("workspace-online-users", onOnlineUsers);
      socket.off("pulse:new", onPulseNew);
      socket.off("workspace:member-joined", onMemberJoined);
    };
  }, [id, fetchData]);

  const createProject = async () => {
    if (!projectName.trim()) return;

    setCreating(true);
    setError("");
    try {
      const res = await api.post("/projects", {
        name: projectName.trim(),
        description: description.trim(),
        workspaceId: id,
      });

      setProjects((prev) => [res.data, ...prev]);
      setProjectName("");
      setDescription("");
    } catch (err) {
      console.error("Failed to create project:", err.message);
      setError("Failed to create project. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const myTasks = tasks.filter(
    (t) => t.assignee === user.id || t.assignee?._id === user.id
  );

  const onlineUserIds = onlineUsers.map((u) => u.userId || u._id).filter(Boolean);

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

  if (loading) {
    return (
      <div className="flex bg-black text-white min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-550">
            <span className="w-6 h-6 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
            <span className="font-mono text-xs">Loading operational timeline...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Dashboard Workspace Content */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="mb-8 border-b border-zinc-900 pb-6 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {workspace?.name || "Workspace Home"}
              </h1>
              <p className="text-zinc-550 text-xs font-mono mt-1.5">
                {workspace?.members?.length || 1} teammate{workspace?.members?.length !== 1 ? "s" : ""} · {projects.length} engineering boards
                {onlineUsers.length > 0 && (
                  <span className="text-emerald-400 ml-2">
                    · {onlineUsers.length} online now
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Online user avatars */}
              {onlineUsers.length > 0 && (
                <div className="flex -space-x-2 items-center">
                  {onlineUsers.slice(0, 5).map((u, i) => (
                    <div key={i} title={u.name || u.userName} className="hover:-translate-y-0.5 transition duration-200">
                      <Avatar alt={u.name || u.userName || "?"} size="sm" showRing ringColor="border-emerald-500" />
                    </div>
                  ))}
                  {onlineUsers.length > 5 && (
                    <span className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] font-extrabold text-zinc-400 ring-2 ring-black">
                      +{onlineUsers.length - 5}
                    </span>
                  )}
                </div>
              )}
              <NotificationBell />
            </div>
          </div>

          <div className="flex flex-col gap-8 max-w-4xl">
            {/* Continue Working & Quick Resume Banner */}
            {(lastTask || myTasks.length > 0) && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider font-mono">Continue Working</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Quick Resume banner */}
                  {lastTask && (
                    <div className="bg-gradient-to-r from-zinc-950 to-zinc-900/60 border border-zinc-850 hover:border-zinc-750 rounded-2xl p-4 flex items-center justify-between group transition duration-300">
                      <div className="min-w-0 flex-1 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-950/40 text-violet-400 border border-violet-900/30 flex items-center justify-center text-sm select-none group-hover:scale-105 transition">
                          ⚡
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Resume last task</span>
                          <h4 className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-violet-300 transition">{lastTask.taskTitle}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/project/${lastTask.projectId}?task=${lastTask.taskId}`)}
                        className="bg-zinc-900 hover:bg-white hover:text-black border border-zinc-800 text-zinc-300 text-[10px] font-bold px-3 py-2 rounded-xl transition ml-3 flex-shrink-0"
                      >
                        Open →
                      </button>
                    </div>
                  )}

                  {/* My Tasks Overview */}
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-350">Assigned Tasks</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">You have {myTasks.length} active assignments in this workspace</p>
                      </div>
                      <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs px-2.5 py-1 rounded-full">
                        {myTasks.filter(t => t.status === "done").length}/{myTasks.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Tasks Mini-ledger */}
                {myTasks.length > 0 && (
                  <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 bg-zinc-900/20 border-b border-zinc-900 text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                      Your Assignments
                    </div>
                    <div className="divide-y divide-zinc-900/60 max-h-40 overflow-y-auto scrollbar-thin">
                      {myTasks.slice(0, 4).map((task) => (
                        <div
                          key={task._id}
                          onClick={() => navigate(`/project/${task.project}?task=${task._id}`)}
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/30 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${task.status === "done" ? "bg-emerald-400" : task.status === "in-progress" ? "bg-amber-400" : "bg-zinc-500"}`} />
                            <span className="text-xs text-zinc-300 truncate font-semibold">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase">{task.priority}</span>
                            <span className="text-zinc-650">→</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Engineering Boards / Projects */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider font-mono">Engineering Boards</h2>
              </div>

              {/* Create project form */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">Create Engineering space</h3>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Board name (e.g. Auth Service, Landing Page, V2 Release)"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-2.5 outline-none focus:border-zinc-700 transition text-xs text-white placeholder-zinc-700"
                  />
                  <textarea
                    placeholder="Short description of technical scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-2.5 outline-none h-16 resize-none focus:border-zinc-700 transition text-xs text-white placeholder-zinc-700"
                  />
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <button
                    onClick={createProject}
                    disabled={creating || !projectName.trim()}
                    className="bg-white text-black py-2 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 text-xs"
                  >
                    {creating ? "Creating..." : "Create Board"}
                  </button>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center">
                  <span className="text-2xl block mb-2">🚧</span>
                  <h4 className="text-xs font-bold text-zinc-400 mb-1">Create your first board</h4>
                  <p className="text-zinc-600 text-[11px]">Boards host sprint tasks, roadmaps, and chat rooms.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {projects.map((project, idx) => {
                    const boardTasks = tasks.filter(t => t.project === project._id);
                    const doneCount = boardTasks.filter(t => t.status === "done").length;
                    const percent = boardTasks.length > 0 ? Math.round((doneCount / boardTasks.length) * 100) : 0;

                    return (
                      <div
                        key={project._id}
                        onClick={() => navigate(`/project/${project._id}`)}
                        className={`group relative bg-gradient-to-br ${PROJECT_COLORS[idx % PROJECT_COLORS.length]} border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/40 flex flex-col justify-between min-h-[130px]`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xs font-extrabold text-zinc-200 group-hover:text-white transition tracking-tight leading-tight">
                              {project.name}
                            </h3>
                            <span className="text-zinc-550 group-hover:text-zinc-350 transition text-sm">→</span>
                          </div>
                          {project.description && (
                            <p className="text-zinc-500 text-[11px] line-clamp-2 leading-relaxed">{project.description}</p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2">
                          {/* Progress bar */}
                          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
                            <span>PROGRESS</span>
                            <span>{doneCount}/{boardTasks.length} ({percent}%)</span>
                          </div>
                          <div className="w-full bg-zinc-900/60 rounded-full h-1 overflow-hidden border border-zinc-850">
                            <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Teammate Pulse */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider font-mono">Teammate Pulse</h2>
                <Link to={`/workspace/${id}/pulse`} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono">
                  Open Engineering Space →
                </Link>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 grid md:grid-cols-2 gap-4">
                <div className="border border-zinc-900 rounded-xl p-3 bg-zinc-900/20">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Active sprint momentum</p>
                  <p className="mt-1 text-xs text-zinc-300">
                    {tasks.filter((t) => t.status !== "done").length} tasks in motion · {tasks.filter((t) => t.status === "done").length} completed
                  </p>
                </div>
                <div className="border border-zinc-900 rounded-xl p-3 bg-zinc-900/20">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">Recent collaboration</p>
                  <p className="mt-1 text-xs text-zinc-300">
                    {pulseEvents[0]?.content || "No recent events yet. AI sprints, tasks, and resources will appear here."}
                  </p>
                  {pulseEvents[0]?.createdAt && (
                    <p className="mt-1 text-[10px] text-zinc-600">{timeAgo(pulseEvents[0].createdAt)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Teammates & Onboarding */}
        <div className="w-72 flex-shrink-0 border-l border-zinc-900 p-4 overflow-y-auto scrollbar-thin">
          <MemberPanel
            workspaceId={id}
            currentUserId={user.id}
            onlineUserIds={onlineUserIds}
          />
        </div>
      </div>
    </div>
  );
};

export default Workspace;