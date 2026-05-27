import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import api from "../lib/axios";
import socket from "../socket";

import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/chat/ChatPanel";
import ActivityPanel from "../components/ActivityPanel";
import TaskModal from "../components/board/TaskModal";
import AiSprintModal from "../components/board/AiSprintModal";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";

const COLUMNS = [
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const PRIORITY_STYLES = {
  high: "bg-red-950/30 text-red-400 border border-red-900/30",
  medium: "bg-amber-950/30 text-amber-400 border border-amber-900/30",
  low: "bg-zinc-800/30 text-zinc-400 border border-zinc-700/30",
};

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
  const [showSprintModal, setShowSprintModal] = useState(false);

  // Dragging state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  // Live peer drag presence: { taskId -> { actorName, columnId } }
  const [peerDrags, setPeerDrags] = useState({});

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Typing indicator from chat
  const [typingUsers, setTypingUsers] = useState([]);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const triggerToast = useCallback((message, icon = "⚡") => {
    const toastId = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id: toastId, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4500);
  }, []);

  // ─── Data fetching ─────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err.message);
    }
  }, [id]);

  // ─── Task creation ─────────────────────────────────────────────────────
  const createTask = async () => {
    if (!title.trim()) return;

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

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

      setTasks((prev) => prev.map((t) => (t._id === tempId ? res.data : t)));

      socket.emit("task-created", {
        projectId: id,
        task: res.data,
        actorName: user.name,
      });
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      setCreateError("Couldn't add that task right now. Double check the network and give it another try!");
      console.error("Failed to create task:", err.message);
    } finally {
      setCreating(false);
    }
  };

  // ─── Task status update ────────────────────────────────────────────────
  const updateTaskStatus = async (taskId, newStatus, taskTitle) => {
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
      fetchTasks();
    }
  };

  // ─── Drag handlers ─────────────────────────────────────────────────────
  const handleDragStart = (initial) => {
    const taskId = initial.draggableId;
    const columnId = initial.source.droppableId;
    setDraggingTaskId(taskId);

    // Broadcast live drag to peers
    socket.emit("task:drag-start", {
      projectId: id,
      taskId,
      actorName: user.name,
      columnId,
    });
  };

  const handleDragEnd = async (result) => {
    const taskId = result.draggableId;
    setDraggingTaskId(null);

    // Broadcast drag end to peers
    socket.emit("task:drag-end", { projectId: id, taskId });

    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;

    const newStatus = result.destination.droppableId;
    const task = tasks.find((t) => t._id === taskId);

    await updateTaskStatus(taskId, newStatus, task?.title);
  };

  // ─── Legacy AI task gen (simple prompt box) ────────────────────────────
  const generateAiTasks = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiError("");
    setAiFallback(false);

    try {
      const res = await api.post("/ai/generate-tasks", { prompt: aiPrompt.trim() });

      if (res.data.isFallback) setAiFallback(true);

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
      setAiError("AI sprint planner hit a brief quota spike. Falling back to offline sequence planning. No momentum lost!");
    } finally {
      setAiLoading(false);
    }
  };

  // Called when sprint modal successfully populates tasks
  const handleSprintAccepted = useCallback((createdTasks) => {
    if (createdTasks.length > 0) {
      setTasks((prev) => [...createdTasks, ...prev]);
      triggerToast(`Sprint loaded — ${createdTasks.length} tasks added to board`, "🚀");
    }
  }, [triggerToast]);

  // ─── Filtering ─────────────────────────────────────────────────────────
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

  // ─── Socket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchTasks().then(() => {
      setLoading(false);
      const params = new URLSearchParams(window.location.search);
      const taskParam = params.get("task");
      if (taskParam) {
        setSelectedTaskId(taskParam);
      }
    });

    if (!socket.connected) socket.connect();
    socket.emit("join-project", { projectId: id, user });

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onTaskCreated = ({ task }) => {
      if (!task) return;
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === task._id);
        if (!exists) {
          triggerToast(`New task: "${task.title}"`, "✨");
          return [task, ...prev];
        }
        return prev;
      });
    };

    const onTaskMoved = ({ taskId, newStatus }) => {
      if (!taskId || !newStatus) return;
      setTasks((prev) => {
        const task = prev.find((t) => t._id === taskId);
        if (task && task.status !== newStatus) {
          triggerToast(`"${task.title}" → ${newStatus}`, "→");
        }
        return prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t));
      });
    };

    const onNewComment = ({ comment }) => {
      if (comment && comment.sender?._id !== user.id) {
        triggerToast(`${comment.sender?.name} commented: "${comment.text.substring(0, 28)}..."`, "💬");
      }
    };

    const onReceiveMessage = (message) => {
      if (message && message.sender?._id !== user.id) {
        triggerToast(`${message.sender?.name || "Team"}: "${message.text.substring(0, 28)}..."`, "💬");
      }
    };

    const onBulkUpdate = () => {
      triggerToast("AI generated new tasks for the project", "✨");
      fetchTasks();
    };

    const onLegacyUpdate = () => fetchTasks();

    const onOnlineUsers = (users) => setOnlineUsers(users);

    const onActivity = (activity) => {
      setActivities((prev) => {
        const key = activity.timestamp + activity.message;
        const exists = prev.some((a) => a.timestamp + a.message === key);
        return exists ? prev : [activity, ...prev].slice(0, 50);
      });
    };

    const onTyping = ({ userName, isTyping }) => {
      if (userName === user.name) return;
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(userName)) return [...prev, userName];
        if (!isTyping) return prev.filter((n) => n !== userName);
        return prev;
      });
    };

    // Peer drag presence
    const onPeerDragStarted = ({ taskId, actorName, columnId }) => {
      if (!taskId) return;
      setPeerDrags((prev) => ({ ...prev, [taskId]: { actorName, columnId } }));
    };

    const onPeerDragEnded = ({ taskId }) => {
      if (!taskId) return;
      setPeerDrags((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("task:created", onTaskCreated);
    socket.on("task:moved", onTaskMoved);
    socket.on("comment:new", onNewComment);
    socket.on("receive-message", onReceiveMessage);
    socket.on("user-typing", onTyping);
    socket.on("task:bulk-update", onBulkUpdate);
    socket.on("receive-task-update", onLegacyUpdate);
    socket.on("online-users", onOnlineUsers);
    socket.on("activity:new", onActivity);
    socket.on("task:drag-started", onPeerDragStarted);
    socket.on("task:drag-ended", onPeerDragEnded);

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.emit("leave-project", { projectId: id });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("task:created", onTaskCreated);
      socket.off("task:moved", onTaskMoved);
      socket.off("comment:new", onNewComment);
      socket.off("receive-message", onReceiveMessage);
      socket.off("user-typing", onTyping);
      socket.off("task:bulk-update", onBulkUpdate);
      socket.off("receive-task-update", onLegacyUpdate);
      socket.off("online-users", onOnlineUsers);
      socket.off("activity:new", onActivity);
      socket.off("task:drag-started", onPeerDragStarted);
      socket.off("task:drag-ended", onPeerDragEnded);
    };
  }, [id]);

  // ─── Column render ─────────────────────────────────────────────────────
  const renderColumn = (columnId, columnLabel, columnTasks) => (
    <Droppable droppableId={columnId} key={columnId}>
      {(provided, snapshot) => (
        <div
          className={`bg-zinc-950/80 border rounded-3xl p-5 min-h-[450px] flex flex-col transition-all duration-200 ${
            snapshot.isDraggingOver
              ? "border-zinc-500 bg-zinc-900/40 shadow-lg shadow-zinc-900/20"
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

          {/* Peer drag ghost card — shows when someone else is dragging INTO this column */}
          {Object.entries(peerDrags).some(([, d]) => d.columnId === columnId) && (
            <div className="mb-2 border border-dashed border-violet-800/50 bg-violet-950/10 rounded-2xl p-3 flex items-center gap-2">
              {Object.entries(peerDrags)
                .filter(([, d]) => d.columnId === columnId)
                .map(([tid, d]) => (
                  <span key={tid} className="text-[10px] text-violet-400 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                    {d.actorName} is moving a task…
                  </span>
                ))}
            </div>
          )}

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[520px] scrollbar-thin pr-0.5">
            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-700 text-xs italic">Drop tasks here</p>
              </div>
            )}

            {columnTasks.map((task, index) => {
              const isPeerDragging = !!peerDrags[task._id];
              const peerDragger = peerDrags[task._id];
              const isNew = task.createdAt && (new Date() - new Date(task.createdAt) < 6500);

              return (
                <Draggable key={task._id} draggableId={task._id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      onClick={() => {
                        if (!task._id.startsWith("temp-")) {
                          setSelectedTaskId(task._id);
                          localStorage.setItem(
                            "lastActiveTask",
                            JSON.stringify({ taskId: task._id, taskTitle: task.title, projectId: id })
                          );
                        }
                      }}
                      className={`bg-zinc-900 border rounded-2xl p-4 transition-all duration-300 group cursor-pointer active:cursor-grabbing ${
                        snapshot.isDragging
                          ? "border-violet-600/60 shadow-xl shadow-violet-900/20 rotate-1 scale-105 ring-1 ring-violet-600/30"
                          : isPeerDragging
                          ? "border-amber-700/50 opacity-60 bg-zinc-900/60 ring-1 ring-amber-800/30"
                          : isNew
                          ? "border-violet-500/80 ring-2 ring-violet-500/30 animate-pulse bg-violet-950/5 shadow-md shadow-violet-950/20"
                          : draggingTaskId && draggingTaskId !== task._id
                          ? "border-zinc-850 opacity-65"
                          : "border-zinc-850 hover:border-zinc-700 hover:shadow-md hover:shadow-black/30 hover:scale-[1.01] hover:bg-zinc-900/80"
                      }`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {/* Peer drag indicator */}
                      {isPeerDragging && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Avatar alt={peerDragger.actorName} size="xs" />
                          <span className="text-[9px] text-amber-400 font-mono">
                            {peerDragger.actorName} is moving this…
                          </span>
                        </div>
                      )}

                      {/* Labels */}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
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

                      {/* Milestone, reviewStage, and deployOrder badges */}
                      {(task.milestone || task.reviewStage || task.deployOrder) && (
                        <div className="flex flex-wrap gap-1.5 mb-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                          {task.milestone && (
                            <span className="text-[9px] bg-violet-950/30 text-violet-400 border border-violet-900/30 px-1.5 py-0.5 rounded font-mono">
                              {task.milestone}
                            </span>
                          )}
                          {task.deployOrder > 0 && (
                            <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded font-mono" title="Deploy sequence order">
                              #{task.deployOrder}
                            </span>
                          )}
                          {task.reviewStage && (
                            <span className="text-[9px] bg-indigo-950/30 text-indigo-400 border border-indigo-900/30 px-1.5 py-0.5 rounded font-mono">
                              🔍 {task.reviewStage.length > 15 ? task.reviewStage.slice(0, 15) + "…" : task.reviewStage}
                            </span>
                          )}
                        </div>
                      )}

                      <h3 className="font-bold text-sm text-zinc-200 group-hover:text-white transition tracking-tight leading-snug">
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-zinc-500 text-xs mt-2 line-clamp-2 leading-relaxed opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                          {task.description}
                        </p>
                      )}

                      {/* Dependencies / Blockers */}
                      {((task.dependencies && task.dependencies.length > 0) || (task.blockers && task.blockers.length > 0)) && (
                        <div className="flex flex-col gap-1 mt-2.5 border-t border-zinc-950 pt-2 font-mono text-[9px] select-none opacity-50 group-hover:opacity-100 transition-opacity duration-200">
                          {task.blockers && task.blockers.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-red-400 font-extrabold text-[8px] tracking-wide uppercase">🚫 Blocked By:</span>
                              {task.blockers.map((b, bi) => (
                                <span key={bi} className="bg-red-950/20 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded" title={b}>
                                  {b.length > 16 ? b.slice(0, 16) + "…" : b}
                                </span>
                              ))}
                            </div>
                          )}
                          {task.dependencies && task.dependencies.length > 0 && !task.blockers?.includes(task.dependencies[0]) && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-zinc-550 font-extrabold text-[8px] tracking-wide uppercase">⛓ Prereq:</span>
                              {task.dependencies.map((d, di) => (
                                <span key={di} className="bg-zinc-950 text-zinc-450 border border-zinc-900 px-1.5 py-0.5 rounded" title={d}>
                                  {d.length > 16 ? d.slice(0, 16) + "…" : d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Due Date & Checklist Indicators */}
                      {(task.dueDate || (task.subtasks && task.subtasks.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-[10px] text-zinc-550 font-mono select-none opacity-55 group-hover:opacity-100 transition-opacity duration-200">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                            </div>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 bg-zinc-950/40 border border-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">
                              <span>📋</span>
                              <span>{task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task._id.startsWith("temp-") ? (
                          <span className="text-[10px] text-zinc-600 italic">saving…</span>
                        ) : (
                          task.assignee && (
                            <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee.name || task.assignee}`}>
                              <Avatar alt={task.assignee.name || "?"} size="xs" />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}

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
              Plan sprints, create tasks manually, or generate with AI Sprint Planner.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Active Teammates */}
            {onlineUsers.length > 0 && (
              <div className="flex -space-x-2.5 items-center mr-2" title="Teammates viewing this project">
                {onlineUsers.slice(0, 5).map((u, index) => {
                  const isTyping = typingUsers.includes(u.name);
                  return (
                    <div
                      key={index}
                      className="transition transform hover:translate-y-[-2px] duration-200"
                      title={isTyping ? `${u.name} is typing...` : u.name}
                    >
                      <Avatar
                        alt={u.name}
                        size="xs"
                        showRing={true}
                        ringColor={isTyping ? "ring-purple-500 animate-pulse border-purple-500/50" : "ring-emerald-500"}
                      />
                    </div>
                  );
                })}
                {onlineUsers.length > 5 && (
                  <span className="flex items-center justify-center bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold text-zinc-400 w-6 h-6 rounded-full shadow-sm pl-0.5 select-none ring-2 ring-black">
                    +{onlineUsers.length - 5}
                  </span>
                )}
              </div>
            )}

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

        {/* Tools row: Manual create + AI buttons */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Manual Task Creation */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold mb-3 text-zinc-300">Add Task</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTask()}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-zinc-700 transition text-white"
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-2.5 outline-none h-16 text-sm resize-none focus:border-zinc-700 transition text-white"
              />
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <button
                onClick={createTask}
                disabled={creating || !title.trim()}
                className="bg-white text-black py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>

          {/* AI Tools */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
            {/* Sprint Planner CTA */}
            <button
              onClick={() => setShowSprintModal(true)}
              className="w-full flex items-center gap-3 bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-800/40 hover:border-violet-700/60 rounded-xl p-4 text-left transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40 flex-shrink-0 group-hover:scale-105 transition">
                <span className="text-base">✨</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-white">AI Sprint Planner</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Generate a full sprint with milestones, priorities and timelines
                </p>
              </div>
              <span className="text-zinc-500 group-hover:text-zinc-300 transition text-sm">→</span>
            </button>

            {/* Quick AI task gen */}
            <div>
              <p className="text-xs font-bold text-zinc-500 mb-2">Quick Generate</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Build a realtime chat app..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateAiTasks()}
                  className="flex-1 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3 py-2 outline-none text-xs focus:border-zinc-700 transition text-white"
                />
                <button
                  onClick={generateAiTasks}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {aiLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      …
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>

              {aiFallback && (
                <p className="text-amber-500 text-[10px] mt-2 flex items-center gap-1.5">
                  ⚠ AI busy — loaded offline tasks instead.
                </p>
              )}
              {aiError && (
                <p className="text-red-400 text-[10px] mt-2">⚠ {aiError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Board Search & Filter Toolbar */}
        {!loading && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/20 border border-zinc-900/60 rounded-2xl p-4 mb-6">
            <div className="flex flex-1 items-center gap-2 max-w-md bg-zinc-900/40 border border-zinc-850/80 rounded-xl px-3 py-2">
              <span className="text-zinc-600 text-xs select-none">🔍</span>
              <input
                type="text"
                placeholder="Filter by title, description, or label..."
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
              <div className="flex items-center gap-1.5 border-r border-zinc-900/80 pr-4">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider select-none">Priority:</span>
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

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider select-none">Assignee:</span>
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

              {(searchQuery || priorityFilter !== "all" || assigneeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setPriorityFilter("all");
                    setAssigneeFilter("all");
                  }}
                  className="text-red-400 hover:text-red-300 text-[9px] uppercase font-extrabold tracking-wider pl-4 border-l border-zinc-900 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Kanban + side panels */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-5 animate-pulse">
            {Array.from({ length: 3 }).map((_, colIdx) => (
              <div key={colIdx} className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-5 min-h-[450px] flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                {Array.from({ length: 2 }).map((_, cardIdx) => (
                  <div key={cardIdx} className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex gap-1.5">
                      <Skeleton className="h-3 w-10 rounded" />
                      <Skeleton className="h-3 w-14 rounded" />
                    </div>
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-10 w-full rounded" />
                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-zinc-900">
                      <Skeleton className="h-3.5 w-10 rounded-full" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
              {/* Columns container: horizontal swipe on mobile, grid on desktop */}
              <div className="lg:col-span-8 flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 scrollbar-none pb-4 w-full md:grid md:grid-cols-3 md:overflow-x-visible">
                {COLUMNS.map(({ id: colId, label }) => (
                  <div key={colId} className="min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-center flex-1">
                    {renderColumn(colId, label, groupedTasks[colId])}
                  </div>
                ))}
              </div>

              {/* Side Panels: Chat + Activity */}
              <div className="lg:col-span-4 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-6 w-full">
                <div className="h-[460px] lg:h-[360px] xl:h-[400px]">
                  <ChatPanel projectId={id} parentTypingUsers={typingUsers} />
                </div>
                <div className="h-[460px] lg:h-[360px] xl:h-[400px]">
                  <ActivityPanel
                    activities={activities}
                    onlineUsers={onlineUsers}
                    onTaskClick={(taskId) => setSelectedTaskId(taskId)}
                  />
                </div>
              </div>
            </div>
          </DragDropContext>
        )}

        {/* Task Detail Modal */}
        {selectedTaskId && (
          <TaskModal
            taskId={selectedTaskId}
            projectId={id}
            onClose={() => setSelectedTaskId(null)}
            onTaskUpdated={fetchTasks}
          />
        )}

        {/* AI Sprint Modal */}
        {showSprintModal && (
          <AiSprintModal
            projectId={id}
            onClose={() => setShowSprintModal(false)}
            onSprintAccepted={handleSprintAccepted}
            actorName={user.name}
          />
        )}

        {/* Floating Toasts */}
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