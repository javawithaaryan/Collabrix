import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import api from "../lib/axios";
import socket from "../socket";

import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/chat/ChatPanel";
import ActivityPanel from "../components/ActivityPanel";
import TaskModal from "../components/board/TaskModal";
import Avatar from "../components/ui/Avatar";

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
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiFallback, setAiFallback] = useState(false);

  // Dragging state for visual feedback
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  
  // Selected task for editing/details view
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Real-time task search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all", "high", "medium", "low"
  const [assigneeFilter, setAssigneeFilter] = useState("all"); // "all", "me", "unassigned"

  // Real-time toast notifications list
  const [toasts, setToasts] = useState([]);

  const triggerToast = useCallback((message, icon = "⚡") => {
    const toastId = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id: toastId, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4500);
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ─── Data fetching ────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err.message);
    }
  }, [id]);

  // ─── Task creation ────────────────────────────────────────────────────
  const createTask = async () => {
    if (!title.trim()) return;

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    // Optimistic UI — add a fake task immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      _id: tempId,
      title: trimmedTitle,
      description: trimmedDesc,
      status: "todo",
      priority: "medium",
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setTitle("");
    setDescription("");
    setCreateError("");
    setCreating(true);

    try {
      const res = await api.post("/tasks", {
        title: trimmedTitle,
        description: trimmedDesc,
        project: id,
        priority: "medium",
      });

      // Replace the optimistic task with the real one
      setTasks((prev) => prev.map((t) => (t._id === tempId ? res.data : t)));

      socket.emit("task-created", {
        projectId: id,
        task: res.data,
        actorName: user.name,
      });
    } catch (err) {
      // Roll back the optimistic task
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      setCreateError("Failed to create task. Try again.");
      console.error("Failed to create task:", err.message);
    } finally {
      setCreating(false);
    }
  };

  // ─── Task status update ───────────────────────────────────────────────
  const updateTaskStatus = async (taskId, newStatus, taskTitle) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });

      const eventName = newStatus === "done" ? "task-completed" : "task-moved";
      socket.emit(eventName, {
        projectId: id,
        taskId,
        newStatus,
        actorName: user.name,
        taskTitle,
      });
    } catch (err) {
      console.error("Failed to update task status:", err.message);
      // Refetch to get back to real state
      fetchTasks();
    }
  };

  const handleDragStart = (initial) => {
    setDraggingTaskId(initial.draggableId);
  };

  const handleDragEnd = async (result) => {
    setDraggingTaskId(null);

    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find((t) => t._id === taskId);

    await updateTaskStatus(taskId, newStatus, task?.title);
  };

  // ─── AI generation ────────────────────────────────────────────────────
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

      // Create all the tasks — do them sequentially to avoid rate limiting
      const created = [];
      for (const task of res.data.result) {
        try {
          const r = await api.post("/tasks", {
            title: task.title,
            description: task.description,
            project: id,
            priority: "medium",
          });
          created.push(r.data);
        } catch (e) {
          console.warn("Skipped one AI task due to error:", e.message);
        }
      }

      // Add them all to local state at once
      if (created.length > 0) {
        setTasks((prev) => [...created, ...prev]);
      }

      socket.emit("tasks-ai-generated", {
        projectId: id,
        count: created.length,
        actorName: user.name,
      });

      setAiPrompt("");
    } catch (err) {
      console.error("AI task generation failed:", err.message);
      setAiError("AI generation failed. Try again in a moment.");
    } finally {
      setAiLoading(false);
    }
  };

  // Filter tasks in real-time based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.labels || []).some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    let matchesAssignee = true;
    if (assigneeFilter === "me") {
      matchesAssignee = task.assignee?._id === user.id || task.assignee === user.id;
    } else if (assigneeFilter === "unassigned") {
      matchesAssignee = !task.assignee;
    }

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const groupedTasks = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    done: filteredTasks.filter((t) => t.status === "done"),
  };

  // ─── Socket setup ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks().then(() => setLoading(false));

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-project", { projectId: id, user });

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    // When someone else creates a task
    const onTaskCreated = ({ task }) => {
      if (!task) return;
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === task._id);
        if (!exists) {
          triggerToast(`New task created: "${task.title}"`, "✨");
          return [task, ...prev];
        }
        return prev;
      });
    };

    // When someone else moves a task
    const onTaskMoved = ({ taskId, newStatus }) => {
      if (!taskId || !newStatus) return;
      setTasks((prev) => {
        const task = prev.find((t) => t._id === taskId);
        if (task && task.status !== newStatus) {
          triggerToast(`Task "${task.title}" moved to ${newStatus}`, "→");
        }
        return prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t));
      });
    };

    // Real-time toast notifications for comments and chat messages
    const onNewComment = ({ comment }) => {
      if (comment && comment.sender?._id !== user.id) {
        triggerToast(`New comment by ${comment.sender?.name}: "${comment.text.substring(0, 25)}..."`, "💬");
      }
    };

    const onReceiveMessage = (message) => {
      if (message && message.sender?._id !== user.id) {
        triggerToast(`New message from ${message.sender?.name || "Team"}: "${message.text.substring(0, 25)}..."`, "💬");
      }
    };

    // Bulk refetch (e.g. after AI generation from another user)
    const onBulkUpdate = () => {
      triggerToast("AI generated new task options for the project", "✨");
      fetchTasks();
    };

    // Legacy event support
    const onLegacyUpdate = () => fetchTasks();

    const onOnlineUsers = (users) => setOnlineUsers(users);

    const onActivity = (activity) => {
      setActivities((prev) => {
        // Deduplicate by timestamp+message
        const key = activity.timestamp + activity.message;
        const exists = prev.some(
          (a) => a.timestamp + a.message === key
        );
        return exists ? prev : [activity, ...prev].slice(0, 50);
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("task:created", onTaskCreated);
    socket.on("task:moved", onTaskMoved);
    socket.on("comment:new", onNewComment);
    socket.on("receive-message", onReceiveMessage);
    socket.on("task:bulk-update", onBulkUpdate);
    socket.on("receive-task-update", onLegacyUpdate); // legacy
    socket.on("online-users", onOnlineUsers);
    socket.on("activity:new", onActivity);

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.emit("leave-project", { projectId: id });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("task:created", onTaskCreated);
      socket.off("task:moved", onTaskMoved);
      socket.off("comment:new", onNewComment);
      socket.off("receive-message", onReceiveMessage);
      socket.off("task:bulk-update", onBulkUpdate);
      socket.off("receive-task-update", onLegacyUpdate);
      socket.off("online-users", onOnlineUsers);
      socket.off("activity:new", onActivity);
      socket.disconnect();
    };
  }, [id]);

  // ─── Render helpers ───────────────────────────────────────────────────
  const priorityStyles = {
    high: "bg-red-950/30 text-red-400 border border-red-900/30",
    medium: "bg-amber-950/30 text-amber-400 border border-amber-900/30",
    low: "bg-zinc-800/30 text-zinc-400 border border-zinc-700/30",
  };

  const renderColumn = (columnId, columnLabel, columnTasks) => (
    <Droppable droppableId={columnId} key={columnId}>
      {(provided, snapshot) => (
        <div
          className={`bg-zinc-950/80 border rounded-3xl p-5 min-h-[450px] flex flex-col transition ${
            snapshot.isDraggingOver
              ? "border-zinc-600 bg-zinc-900/40"
              : "border-zinc-900 hover:border-zinc-800"
          }`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
            <h2 className="text-sm font-extrabold text-zinc-400 uppercase tracking-wider">
              {columnLabel}
            </h2>
            <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
              {columnTasks.length}
            </span>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-700 text-xs italic">Drop tasks here</p>
              </div>
            )}

            {columnTasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    onClick={() => !task._id.startsWith("temp-") && setSelectedTaskId(task._id)}
                    className={`bg-zinc-900 border rounded-2xl p-4 transition group cursor-pointer active:cursor-grabbing shadow-sm hover:scale-[1.01] hover:shadow-md ${
                      snapshot.isDragging
                        ? "border-zinc-600 shadow-lg shadow-black/50 rotate-1 scale-105"
                        : draggingTaskId && draggingTaskId !== task._id
                        ? "border-zinc-850 opacity-60"
                        : "border-zinc-850 hover:border-zinc-700"
                    }`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {/* Render labels if any */}
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.labels.map((l, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-750 uppercase tracking-wider"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}

                    <h3 className="font-bold text-sm text-zinc-200 group-hover:text-white transition tracking-tight">
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-zinc-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    
                    {/* Due Date Indicator */}
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-600 font-mono">
                        <span>📅</span>
                        <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          priorityStyles[task.priority] || priorityStyles.medium
                        }`}
                      >
                        {task.priority}
                      </span>
                      
                      {task._id.startsWith("temp-") ? (
                        <span className="text-[10px] text-zinc-600 italic">saving...</span>
                      ) : (
                        task.assignee && (
                          <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name}`}>
                            <Avatar alt={task.assignee.name} size="xs" />
                          </div>
                        )
                      )}
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-5">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Project Board
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Plan sprints, create tasks manually or generate with Gemini AI.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Active Teammates (Overlapping Avatar Pills) */}
            {onlineUsers.length > 0 && (
              <div className="flex -space-x-2.5 items-center mr-2" title="Teammates currently viewing this project">
                {onlineUsers.slice(0, 5).map((u, index) => (
                  <div key={index} className="transition transform hover:translate-y-[-2px] duration-200">
                    <Avatar alt={u.name} size="xs" showRing={true} ringColor="ring-emerald-500" />
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <span className="flex items-center justify-center bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold text-zinc-400 w-6 h-6 rounded-full shadow-sm pl-0.5 select-none ring-2 ring-black">
                    +{onlineUsers.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* Socket status dot */}
            <div
              className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500"
              title={socketConnected ? "Realtime connected" : "Connecting..."}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? "bg-emerald-400 animate-pulse" : "bg-yellow-500"
                }`}
              />
              {socketConnected ? "live" : "connecting"}
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 font-mono">
              Room: {id.slice(-6)}
            </div>
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
              onKeyDown={(e) => e.key === "Enter" && createTask()}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none text-sm focus:border-zinc-700 transition text-white"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 outline-none h-20 text-sm resize-none focus:border-zinc-700 transition text-white"
            />
            {createError && (
              <p className="text-red-400 text-xs">{createError}</p>
            )}
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
          <p className="text-zinc-500 text-xs mb-4">
            Describe your project and Gemini will suggest tasks to add.
          </p>

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
              {aiLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "✨ Generate Tasks"
              )}
            </button>
          </div>

          {aiFallback && (
            <p className="text-yellow-500 text-xs mt-3 flex items-center gap-1.5 bg-yellow-950/30 border border-yellow-900/30 p-2.5 rounded-lg max-w-xl">
              <span>⚠</span> AI is busy right now. Loaded smart offline tasks based on your prompt instead.
            </p>
          )}

          {aiError && (
            <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5 bg-red-950/30 border border-red-900/30 p-2.5 rounded-lg max-w-xl">
              <span>⚠</span> {aiError}
            </p>
          )}
        </div>

        {/* Board Search & Filter Toolbar */}
        {!loading && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/20 border border-zinc-900/60 rounded-2xl p-4 mb-6">
            <div className="flex flex-1 items-center gap-2 max-w-md bg-zinc-900/40 border border-zinc-850/80 rounded-xl px-3 py-2">
              <span className="text-zinc-600 text-xs select-none">🔍</span>
              <input
                type="text"
                placeholder="Filter board by title, desc, or label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-zinc-350 outline-none w-full placeholder-zinc-700 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-650 hover:text-zinc-400 text-xs transition"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Priority Filter */}
              <div className="flex items-center gap-1.5 border-r border-zinc-900/80 pr-4 mr-1">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider select-none mr-1">Priority:</span>
                {["all", "high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded transition ${
                      priorityFilter === p
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Assignee Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider select-none mr-1">Assignee:</span>
                {["all", "me", "unassigned"].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAssigneeFilter(a)}
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded transition ${
                      assigneeFilter === a
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Clear filters trigger */}
              {(searchQuery || priorityFilter !== "all" || assigneeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPriorityFilter("all");
                    setAssigneeFilter("all");
                  }}
                  className="text-red-400 hover:text-red-300 text-[9px] uppercase font-extrabold tracking-wider pl-4 border-l border-zinc-900 transition"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Kanban + panels */}
        {loading ? (
          <div className="flex items-center gap-3 text-zinc-500 py-10">
            <span className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            <span>Loading board...</span>
          </div>
        ) : (
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                  onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                />
              </div>
            </div>
          </DragDropContext>
        )}

        {selectedTaskId && (
          <TaskModal
            taskId={selectedTaskId}
            projectId={id}
            onClose={() => setSelectedTaskId(null)}
            onTaskUpdated={fetchTasks}
          />
        )}

        {/* Floating Toast Notifications Container */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in {
              animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-950/95 border border-zinc-850 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 w-80 animate-slide-in pointer-events-auto hover:border-zinc-700 transition duration-300"
            >
              <span className="text-base select-none mt-0.5">{t.icon}</span>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans flex-1 break-words">{t.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Project;