import { useEffect, useState } from "react";
import axios from "../lib/axios";

const Dashboard = () => {
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWorkspaces(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const createWorkspace = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/workspaces",
        {
          name: workspaceName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWorkspaceName("");
      fetchWorkspaces();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-2">
        Welcome to Collabrix
      </h1>

      <p className="text-zinc-400 mb-10">
        Your developer collaboration workspace
      </p>

      <div className="flex gap-4 mb-10">
        <input
          type="text"
          placeholder="Enter workspace name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 outline-none"
        />

        <button
          onClick={createWorkspace}
          className="bg-white text-black px-8 rounded-xl font-semibold"
        >
          Create
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {workspaces.map((workspace) => (
          <div
            key={workspace._id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-semibold">
              {workspace.name}
            </h2>

            <p className="text-zinc-500 mt-2 text-sm">
              Workspace ID: {workspace._id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;