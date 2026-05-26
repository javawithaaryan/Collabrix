import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

import api from "../lib/axios";
import socket from "../socket";

import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/chat/ChatPanel";
import ActivityPanel from "../components/ActivityPanel";

const COLUMNS = [
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const Project = () => {
  const { id } = useParams();

  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // AI task generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiFallback, setAiFallback] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err.message);
    }
  };

  const createTask = async () => {
    if (!title.trim()) return;

    setCreating(true);
    try {
      await api.post("/tasks", {
        title: title.trim(),
        description: description.trim(),
        project: id,
        priority: "medium",
      });

      socket.emit("task-updated", {
        projectId: id,
        message: `${user.name} created a task`,
      });

      setTitle("");
      setDescription("");
      fetchTasks();
    } catch (err) {
      console.error("Failed to create task:", err.message);
    } finally {
      setCreating(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });

      socket.emit("task-updated", {
        projectId: id,
        message: `${user.name} moved a task to ${status}`,
      });

      fetchTasks();
    } catch (err) {
      console.error("Failed to update task status:", err.message);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    await updateTaskStatus(taskId, newStatus);
  };

  // Generate tasks using AI, then let user choose which ones to add
  const generateAiTasks = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiError("");
    setAiFallback(false);

    try {
      const res = await api.post("/ai/generate-tasks", { prompt: aiPrompt.trim() });

      if (res.data.isFallback) {
        setAiFallback(true);
      }

      // Create all generated tasks in the project
      for (const task of res.data.result) {
        await api.post("/tasks", {
          title: task.title,
          description: task.description,
          project: id,
          priority: "medium",
        });
      }

      socket.emit("task-updated", {
        projectId: id,
        message: `${user.name} generated tasks with AI`,
      });

      setAiPrompt("");
      fetchTasks();
    } catch (err) {
      console.error("AI task generation failed:", err.message);
      setAiError("AI generation failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  useEffect(() => {
    fetchTasks();

    // Connect the socket when entering a project room
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-project", { projectId: id, user });

    socket.on("receive-task-update", () => {
      fetchTasks();
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("activity", (activity) => {
      setActivities((prev) => [activity, ...prev]);
    });

    return () => {
      socket.off("receive-task-update");
      socket.off("online-users");
      socket.off("activity");
      socket.disconnect();
    };
  }, []);


  const renderColumn = (columnId, columnLabel, columnTasks) => (
    <Droppable droppableId={columnId} key={columnId}>
      {(provided) => (
        <div
          className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 min-h-[400px] flex flex-col"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h2 className="text-lg font-bold mb-4 text-zinc-300">{columnLabel}</h2>

          <div className="flex flex-col gap-3 flex-1">
            {columnTasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided) => (
                  <div
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <h3 className="font-semibold text-sm">{task.title}</h3>
                    {task.description && (
                      <p className="text-zinc-500 text-xs mt-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-900 text-red-300"
                          : task.priority === "low"
                          ? "bg-zinc-800 text-zinc-400"
                          : "bg-yellow-900 text-yellow-300"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-5">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Project Board</h1>
            <p className="text-zinc-500 text-sm mt-1">Plan sprints, create tasks manually or generate with Gemini AI.</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-full px-4.5 py-1.5 text-xs text-zinc-400 font-mono">
            Room ID: {id.slice(-6)}
          </div>
        </div>

        {/* Manual task creation */}
        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-semibold mb-4 text-zinc-300">Add Task</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none text-sm focus:border-zinc-700 transition text-white"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none h-20 text-sm resize-none focus:border-zinc-700 transition text-white"
            />
            <button
              onClick={createTask}
              disabled={creating || !title.trim()}
              className="bg-white text-black py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>

        {/* AI task generation */}
        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold mb-1 text-zinc-300">Generate Tasks with AI</h2>
          <p className="text-zinc-500 text-xs mb-4">Describe your project and AI will suggest tasks to add.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Build a realtime chat app with auth and socket.io"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateAiTasks()}
              className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none text-sm focus:border-zinc-700 transition text-white"
            />
            <button
              onClick={generateAiTasks}
              disabled={aiLoading || !aiPrompt.trim()}
              className="bg-white text-black px-6 py-3 sm:py-0 rounded-xl text-sm font-bold hover:bg-zinc-200 transition disabled:opacity-50 whitespace-nowrap"
            >
              {aiLoading ? "Generating..." : "Generate Tasks"}
            </button>
          </div>

          {aiFallback && (
            <p className="text-yellow-500 text-xs mt-3 flex items-center gap-1.5 bg-yellow-950/30 border border-yellow-900/30 p-2.5 rounded-lg max-w-xl">
              <span>⚠</span> AI is currently offline. Loaded customized offline tasks based on prompt instead.
            </p>
          )}

          {aiError && (
            <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5 bg-red-950/30 border border-red-900/30 p-2.5 rounded-lg max-w-xl">
              <span>⚠</span> {aiError}
            </p>
          )}
        </div>

        {/* Kanban board + panels */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid xl:grid-cols-5 gap-5">
            {COLUMNS.map(({ id: colId, label }) =>
              renderColumn(colId, label, groupedTasks[colId])
            )}

            <div className="h-[70vh]">
              <ChatPanel projectId={id} />
            </div>

            <div className="h-[70vh]">
              <ActivityPanel
                activities={activities}
                onlineUsers={onlineUsers}
              />
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Project;