import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import axios from "../lib/axios";

import socket from "../socket";

import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";

const Project = () => {
  const { id } = useParams();

  const [tasks, setTasks] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const createTask = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "/tasks",
        {
          title,
          description,
          project: id,
          priority: "medium",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("task-updated", {
        projectId: id,
      });

      setTitle("");
      setDescription("");

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `/tasks/${taskId}`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      socket.emit("task-updated", {
        projectId: id,
      });

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  const todoTasks = tasks.filter(
    (task) => task.status === "todo"
  );

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress"
  );

  const doneTasks = tasks.filter(
    (task) => task.status === "done"
  );

  useEffect(() => {
    fetchTasks();

    socket.emit("join-project", id);

    socket.on("receive-task-update", () => {
      fetchTasks();
    });

    return () => {
      socket.off("receive-task-update");
    };
  }, []);

  const renderTaskCard = (task) => (
    <div
      key={task._id}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
    >
      <h3 className="text-xl font-semibold">
        {task.title}
      </h3>

      <p className="text-zinc-400 mt-3">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-5">
        <span className="text-sm text-zinc-500">
          {task.priority}
        </span>

        <span className="text-sm text-zinc-500">
          {task.status}
        </span>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={() =>
            updateTaskStatus(task._id, "todo")
          }
          className="bg-zinc-800 px-3 py-2 rounded-lg text-sm"
        >
          Todo
        </button>

        <button
          onClick={() =>
            updateTaskStatus(task._id, "in-progress")
          }
          className="bg-blue-600 px-3 py-2 rounded-lg text-sm"
        >
          Progress
        </button>

        <button
          onClick={() =>
            updateTaskStatus(task._id, "done")
          }
          className="bg-green-600 px-3 py-2 rounded-lg text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-5xl font-bold mb-10">
          Project Board
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <textarea
              placeholder="Task description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none h-28"
            />

            <button
              onClick={createTask}
              className="bg-white text-black py-3 rounded-xl font-semibold"
            >
              Create Task
            </button>
          </div>
        </div>

        <div className="grid xl:grid-cols-4 gap-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5">
            <h2 className="text-2xl font-bold mb-5">
              Todo
            </h2>

            <div className="flex flex-col gap-4">
              {todoTasks.map(renderTaskCard)}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5">
            <h2 className="text-2xl font-bold mb-5">
              In Progress
            </h2>

            <div className="flex flex-col gap-4">
              {inProgressTasks.map(renderTaskCard)}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5">
            <h2 className="text-2xl font-bold mb-5">
              Done
            </h2>

            <div className="flex flex-col gap-4">
              {doneTasks.map(renderTaskCard)}
            </div>
          </div>

          <div className="h-[80vh]">
            <ChatPanel projectId={id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;