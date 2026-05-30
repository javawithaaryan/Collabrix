import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import GlobalLayout from "../components/layouts/GlobalLayout";
import { workspaceService } from "../services/workspace.service";
import { navigateToWorkspace } from "../utils/workspaceRoutes";

export default function MyWorkspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadWorkspaces() {
      try {
        const data = await workspaceService.getWorkspaces();
        if (mounted) setWorkspaces(data || []);
      } catch (err) {
        console.error("Failed to load workspaces:", err.message);
        if (mounted) setError("Could not load workspaces.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadWorkspaces();
    return () => {
      mounted = false;
    };
  }, []);

  const createWorkspace = async (event) => {
    event.preventDefault();
    if (!name.trim() || creating) return;

    setCreating(true);
    setError("");
    try {
      const created = await workspaceService.createWorkspace(name.trim(), description.trim());
      setWorkspaces((current) => [created, ...current]);
      setName("");
      setDescription("");
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create workspace:", err.message);
      setError(err.response?.data?.message || "Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <GlobalLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Workspaces</h1>
            <p className="text-slate-400">Manage and explore your team spaces</p>
          </div>
          <button
            onClick={() => setShowCreate((value) => !value)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Create Workspace
          </button>
        </div>

        {showCreate && (
          <form onSubmit={createWorkspace} className="mb-8 bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Workspace name"
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white outline-none focus:border-blue-500"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
            />
            <button
              disabled={creating || !name.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              {creating ? "Creating..." : "Save Workspace"}
            </button>
          </form>
        )}

        {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

        {loading ? (
          <div className="text-slate-400">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-slate-400">
            No workspaces yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => {
              const memberCount = workspace.members?.length || 1;

              return (
                <button
                  key={workspace._id}
                  onClick={() => navigateToWorkspace(navigate, workspace._id)}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 cursor-pointer transition text-left"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{workspace.name}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-slate-400 text-sm">Members</div>
                      <div className="text-lg font-semibold text-white">{memberCount}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Created</div>
                      <div className="text-lg font-semibold text-white">
                        {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : "Ready"}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">
                      ID: {workspace._id.slice(-6)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-500/20 text-green-400">
                      Active
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </GlobalLayout>
  );
}
