import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../lib/axios";
import Sidebar from "../components/Sidebar";

const Workspace = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to load projects:", err.message);
      setError("Could not load projects. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!projectName.trim()) return;

    setCreating(true);
    try {
      await api.post("/projects", {
        name: projectName.trim(),
        description: description.trim(),
        workspaceId: id,
      });

      setProjectName("");
      setDescription("");
      fetchProjects();
    } catch (err) {
      console.error("Failed to create project:", err.message);
      setError("Failed to create project. Try again.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-10">
        <h1 className="text-5xl font-bold mb-2">Workspace</h1>
        <p className="text-zinc-400 mb-10">Manage your projects</p>

        <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-6 mb-10 max-w-4xl">
          <h2 className="text-xl font-bold mb-4 tracking-tight text-zinc-300">Create Project</h2>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800/85 rounded-xl px-4 py-3 outline-none focus:border-zinc-700 transition text-sm text-white"
            />

            <textarea
              placeholder="Project description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800/85 rounded-xl px-4 py-3 outline-none h-24 resize-none focus:border-zinc-700 transition text-sm text-white"
            />

            <button
              onClick={createProject}
              disabled={creating || !projectName.trim()}
              className="bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition disabled:opacity-50 text-sm"
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-6">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-zinc-500">
            <span className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            <span>Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center max-w-4xl">
            <span className="text-3xl mb-3 block">🚀</span>
            <p className="text-zinc-500 text-sm">No projects yet. Create one above to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                className="group relative bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 cursor-pointer transition flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold group-hover:text-white transition tracking-tight text-zinc-300">
                      {project.name}
                    </h2>
                    <span className="text-zinc-700 group-hover:text-zinc-400 transition text-sm">
                      →
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-zinc-500 mt-2 text-xs line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-4">
                  <span className="flex items-center gap-1.5 bg-zinc-900/60 text-zinc-400 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-850 group-hover:bg-zinc-800 transition">
                    Active Board
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;