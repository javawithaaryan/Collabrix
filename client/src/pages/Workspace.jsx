import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import axios from "../lib/axios";

import Sidebar from "../components/Sidebar";

const Workspace = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const [projects, setProjects] = useState([]);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProjects(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const createProject = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/projects",
        {
          name: projectName,
          description,
          workspaceId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjectName("");
      setDescription("");

      fetchProjects();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-10">
        <h1 className="text-5xl font-bold mb-2">
          Workspace
        </h1>

        <p className="text-zinc-400 mb-10">
          Workspace ID: {id}
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <h2 className="text-2xl font-semibold mb-5">
            Create Project
          </h2>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) =>
                setProjectName(e.target.value)
              }
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <textarea
              placeholder="Project description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none h-32"
            />

            <button
              onClick={createProject}
              className="bg-white text-black py-3 rounded-xl font-semibold"
            >
              Create Project
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() =>
                navigate(`/project/${project._id}`)
              }
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-zinc-600 transition"
            >
              <h2 className="text-2xl font-semibold">
                {project.name}
              </h2>

              <p className="text-zinc-400 mt-3">
                {project.description}
              </p>

              <p className="text-zinc-600 mt-4 text-sm">
                Project ID: {project._id}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workspace;