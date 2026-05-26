import { useEffect, useState } from "react";
import API from "../lib/axios";

function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const response = await API.get("/workspaces");
      setWorkspaces(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();

    if (!workspaceName.trim()) return;

    try {
      const response = await API.post("/workspaces", {
        name: workspaceName,
      });

      setWorkspaces((prev) => [response.data, ...prev]);

      setWorkspaceName("");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          Welcome to Collabrix
        </h1>

        <p className="text-zinc-400 mb-10">
          Your developer collaboration workspace
        </p>

        <form
          onSubmit={createWorkspace}
          className="flex gap-4 mb-10"
        >
          <input
            type="text"
            placeholder="Enter workspace name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
          />

          <button
            type="submit"
            className="bg-white text-black px-6 py-3 rounded-xl font-medium"
          >
            Create
          </button>
        </form>

        {loading ? (
          <p className="text-zinc-500">Loading workspaces...</p>
        ) : workspaces.length === 0 ? (
          <p className="text-zinc-500">
            No workspaces created yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <h2 className="text-xl font-semibold">
                  {workspace.name}
                </h2>

                <p className="text-zinc-500 text-sm mt-1">
                  Workspace ID: {workspace._id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;