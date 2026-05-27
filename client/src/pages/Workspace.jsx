import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../lib/axios";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import MemberPanel from "../components/workspace/MemberPanel";
import Avatar from "../components/ui/Avatar";

const PROJECT_COLORS = [
  "from-violet-900/30 to-indigo-900/20 border-violet-800/30 hover:border-violet-700/50",
  "from-emerald-900/20 to-teal-900/20 border-emerald-800/30 hover:border-emerald-700/50",
  "from-amber-900/20 to-orange-900/20 border-amber-800/30 hover:border-amber-700/50",
  "from-blue-900/20 to-cyan-900/20 border-blue-800/30 hover:border-blue-700/50",
  "from-rose-900/20 to-pink-900/20 border-rose-800/30 hover:border-rose-700/50",
];

const Workspace = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchData = useCallback(async () => {
    try {
      const [wsRes, projRes] = await Promise.all([
        api.get(`/workspaces/${id}`),
        api.get(`/projects/${id}`),
      ]);
      setWorkspace(wsRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error("Failed to load workspace:", err.message);
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
    socket.on("online-users", onOnlineUsers);

    return () => {
      socket.emit("leave-workspace", { workspaceId: id });
      socket.off("online-users", onOnlineUsers);
    };
  }, [id]);

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

  const onlineUserIds = onlineUsers.map((u) => u.userId || u._id).filter(Boolean);

  if (loading) {
    return (
      <div className="flex bg-black text-white min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-500">
            <span className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            <span>Loading workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-8 border-b border-zinc-900 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  {workspace?.name || "Workspace"}
                </h1>
                <p className="text-zinc-500 text-sm mt-1.5">
                  {workspace?.members?.length || 1} teammate{workspace?.members?.length !== 1 ? "s" : ""} · {projects.length} project{projects.length !== 1 ? "s" : ""}
                  {onlineUsers.length > 0 && (
                    <span className="text-emerald-500 ml-2">
                      · {onlineUsers.length} online now
                    </span>
                  )}
                </p>
              </div>

              {/* Online teammate avatars */}
              {onlineUsers.length > 0 && (
                <div className="flex -space-x-2 items-center">
                  {onlineUsers.slice(0, 6).map((u, i) => (
                    <div key={i} title={u.name || u.userName} className="hover:translate-y-[-2px] transition">
                      <Avatar alt={u.name || u.userName || "?"} size="sm" showRing ringColor="border-emerald-400" />
                    </div>
                  ))}
                  {onlineUsers.length > 6 && (
                    <span className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] font-extrabold text-zinc-400 ring-2 ring-black pl-1">
                      +{onlineUsers.length - 6}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Create project form */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 mb-8 max-w-xl">
            <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider mb-4">
              New Project
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Project name (e.g. Sprint 1, Auth System, Mobile App)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none focus:border-zinc-700 transition text-sm text-white placeholder-zinc-600"
              />
              <textarea
                placeholder="What's this project about? (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none h-20 resize-none focus:border-zinc-700 transition text-sm text-white placeholder-zinc-600"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={createProject}
                disabled={creating || !projectName.trim()}
                className="bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-100 transition disabled:opacity-50 text-sm"
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>

          {/* Projects grid */}
          {projects.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-10 text-center max-w-md">
              <span className="text-3xl block mb-3">🚧</span>
              <h3 className="text-base font-bold text-zinc-300 mb-2">Start your first project</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Projects are where your team's sprints, tasks, and conversations live. Create one above and invite your team.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider">
                  Projects ({projects.length})
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {projects.map((project, idx) => (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/project/${project._id}`)}
                    className={`group relative bg-gradient-to-br ${PROJECT_COLORS[idx % PROJECT_COLORS.length]} border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/30 flex flex-col justify-between min-h-[130px]`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-sm font-extrabold text-zinc-200 group-hover:text-white transition tracking-tight leading-tight">
                          {project.name}
                        </h2>
                        <span className="text-zinc-500 group-hover:text-zinc-300 transition text-sm flex-shrink-0 ml-2">→</span>
                      </div>
                      {project.description && (
                        <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-[10px] text-zinc-500 font-mono">Active Board</span>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {new Date(project.createdAt || Date.now()).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — team members */}
        <div className="w-72 flex-shrink-0 border-l border-zinc-900 p-4 overflow-y-auto">
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