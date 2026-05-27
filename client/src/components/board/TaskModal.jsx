import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../lib/axios";
import socket from "../../socket";
import Avatar from "../ui/Avatar";

export default function TaskModal({ taskId, projectId, onClose, onTaskUpdated }) {
  // Presence: who else is viewing / editing this task
  const [viewers, setViewers] = useState([]);
  const [editingUser, setEditingUser] = useState(null); // { userName, field }
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);
  const [workspaceResources, setWorkspaceResources] = useState([]);

  // Edit states
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const commentEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Announce we're viewing this task when the modal opens
  useEffect(() => {
    socket.emit("task:viewing-start", { projectId, taskId, userName: user.name });
    return () => {
      socket.emit("task:viewing-stop", { projectId, taskId, userName: user.name });
    };
  }, [taskId, projectId]);

  // Listen for other viewers and editing states
  useEffect(() => {
    const onViewersUpdated = ({ taskId: incomingId, userName, action }) => {
      if (incomingId !== taskId || userName === user.name) return;
      setViewers((prev) => {
        if (action === "join") {
          return prev.includes(userName) ? prev : [...prev, userName];
        } else {
          return prev.filter((n) => n !== userName);
        }
      });
    };

    const onEditingUpdated = ({ taskId: incomingId, userName, field, action }) => {
      if (incomingId !== taskId || userName === user.name) return;
      if (action === "start") {
        setEditingUser({ userName, field });
      } else {
        setEditingUser(null);
      }
    };

    socket.on("task:viewers-updated", onViewersUpdated);
    socket.on("task:editing-updated", onEditingUpdated);

    return () => {
      socket.off("task:viewers-updated", onViewersUpdated);
      socket.off("task:editing-updated", onEditingUpdated);
    };
  }, [taskId]);

  // Fetch task, comments, and users
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch task details
      const taskRes = await api.get(`/tasks/${projectId}`);
      const foundTask = taskRes.data.find((t) => t._id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setDescription(foundTask.description || "");
      }
      setProjectTasks((taskRes.data || []).filter((t) => t._id !== taskId));

      // Fetch comments
      const commentsRes = await api.get(`/tasks/${taskId}/comments`);
      setComments(commentsRes.data);

      // Fetch system users for assignee dropdown
      const usersRes = await api.get("/auth/users");
      setUsers(usersRes.data);

      // Fetch workspace resources
      const wsId = localStorage.getItem("activeWorkspaceId");
      if (wsId) {
        const resRes = await api.get(`/resources/workspace/${wsId}?limit=100`);
        setWorkspaceResources(resRes.data.resources || []);
      }
    } catch (err) {
      console.error("Failed to load task details:", err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  const handleAttachResource = async (resourceId) => {
    try {
      const res = await api.post(`/resources/${resourceId}/attach`, { taskId, action: "attach" });
      fetchData();
      socket.emit("task-updated", {
        projectId,
        message: `${user.name} linked reference resource "${res.data.title}" to task "${task.title}"`,
      });
    } catch (err) {
      console.error("Failed to attach resource:", err.message);
    }
  };

  const handleDetachResource = async (resourceId) => {
    try {
      const res = await api.post(`/resources/${resourceId}/attach`, { taskId, action: "detach" });
      fetchData();
      socket.emit("task-updated", {
        projectId,
        message: `${user.name} unlinked resource "${res.data.title}" from task "${task.title}"`,
      });
    } catch (err) {
      console.error("Failed to detach resource:", err.message);
    }
  };

  const handleAddDependency = (title) => {
    if (!title || (task.dependencies || []).includes(title)) return;
    const updated = [...(task.dependencies || []), title];
    saveTaskUpdates({ dependencies: updated });
  };

  const handleRemoveDependency = (titleToRemove) => {
    const updated = (task.dependencies || []).filter((d) => d !== titleToRemove);
    saveTaskUpdates({ dependencies: updated });
  };

  const handleAddBlocker = (title) => {
    if (!title || (task.blockers || []).includes(title)) return;
    const updated = [...(task.blockers || []), title];
    saveTaskUpdates({ blockers: updated });
  };

  const handleRemoveBlocker = (titleToRemove) => {
    const updated = (task.blockers || []).filter((b) => b !== titleToRemove);
    saveTaskUpdates({ blockers: updated });
  };

  useEffect(() => {
    fetchData();

    // Listen for realtime comment updates
    const onNewComment = ({ taskId: incomingTaskId, comment }) => {
      if (incomingTaskId === taskId) {
        setComments((prev) => {
          const exists = prev.some((c) => c._id === comment._id);
          return exists ? prev : [...prev, comment];
        });
      }
    };

    socket.on("comment:new", onNewComment);

    return () => {
      socket.off("comment:new", onNewComment);
    };
  }, [taskId, fetchData]);

  // Scroll to bottom of comments
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Save general updates
  const saveTaskUpdates = async (fields) => {
    try {
      // Optimistic state
      setTask((prev) => ({ ...prev, ...fields }));

      const res = await api.put(`/tasks/${taskId}`, fields);
      setTask(res.data);
      onTaskUpdated();

      // Broadcast changes
      socket.emit("task-updated", {
        projectId,
        message: `${user.name} updated task details for "${res.data.title}"`,
      });
    } catch (err) {
      console.error("Failed to update task:", err.message);
      fetchData(); // Rollback
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== task.title) {
      saveTaskUpdates({ title: title.trim() });
    }
  };

  const handleDescSubmit = () => {
    setIsEditingDesc(false);
    socket.emit("task:editing-stop", { projectId, taskId, userName: user.name });
    if (description !== task.description) {
      saveTaskUpdates({ description: description.trim() });
    }
  };

  const handleAddLabel = (e) => {
    if (e.key === "Enter" && newLabel.trim()) {
      e.preventDefault();
      const updatedLabels = [...(task.labels || []), newLabel.trim()];
      saveTaskUpdates({ labels: updatedLabels });
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove) => {
    const updatedLabels = (task.labels || []).filter((l) => l !== labelToRemove);
    saveTaskUpdates({ labels: updatedLabels });
  };

  const handleAddSubtask = (e) => {
    if (e.key === "Enter" && newSubtaskTitle.trim()) {
      e.preventDefault();
      const updatedSubtasks = [
        ...(task.subtasks || []),
        { title: newSubtaskTitle.trim(), isCompleted: false },
      ];
      saveTaskUpdates({ subtasks: updatedSubtasks });
      setNewSubtaskTitle("");
    }
  };

  const handleToggleSubtask = (index) => {
    const updatedSubtasks = (task.subtasks || []).map((sub, idx) =>
      idx === index ? { ...sub, isCompleted: !sub.isCompleted } : sub
    );
    saveTaskUpdates({ subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (index) => {
    const updatedSubtasks = (task.subtasks || []).filter((_, idx) => idx !== index);
    saveTaskUpdates({ subtasks: updatedSubtasks });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || savingComment) return;

    setSavingComment(true);
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { text: newComment.trim() });

      // Add to local state
      setComments((prev) => [...prev, res.data]);
      setNewComment("");

      // Broadcast to room
      socket.emit("task-comment-added", {
        projectId,
        taskId,
        comment: res.data,
        actorName: user.name,
        taskTitle: task.title,
      });
    } catch (err) {
      console.error("Failed to add comment:", err.message);
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading task workspace...</p>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-sm overflow-y-auto animate-overlay">
      <style>{`
        @keyframes overlayFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
        @keyframes modalScaleUp {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-overlay {
          animation: overlayFade 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-modal {
          animation: modalScaleUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-modal">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80 backdrop-blur">
          <div className="flex-1 mr-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-lg font-bold text-white w-full outline-none focus:border-zinc-700"
                autoFocus
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-extrabold text-white tracking-tight cursor-pointer hover:bg-zinc-900/40 rounded px-2 py-1 -ml-2 transition"
                title="Click to edit title"
              >
                {task.title}
              </h2>
            )}

            {/* Live presence badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {viewers.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full font-mono"
                >
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  {name} is viewing
                </span>
              ))}
              {editingUser && (
                <span className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  {editingUser.userName} is editing{editingUser.field ? ` ${editingUser.field}` : ""}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition w-8 h-8 rounded-full border border-zinc-900 hover:border-zinc-800 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Split */}
        <div className="flex-1 overflow-y-auto grid md:grid-cols-3">
          {/* Main Details & Comments */}
          <div className="md:col-span-2 p-6 border-r border-zinc-900 flex flex-col gap-6 overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-thin">
            {/* Description */}
            <div>
              <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">Description</h4>
              {isEditingDesc ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => socket.emit("task:editing-start", { projectId, taskId, userName: user.name, field: "description" })}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 w-full min-h-[120px] outline-none focus:border-zinc-700 resize-none font-sans leading-relaxed"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setIsEditingDesc(false); socket.emit("task:editing-stop", { projectId, taskId, userName: user.name }); }}
                      className="px-3.5 py-1.5 border border-zinc-850 hover:border-zinc-700 text-xs font-bold text-zinc-400 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDescSubmit}
                      className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-250 text-xs font-bold rounded-xl transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-900/50 hover:border-zinc-850 rounded-2xl p-4 text-sm text-zinc-300 leading-relaxed cursor-pointer min-h-[80px] transition"
                  title="Click to edit description"
                >
                  {task.description || <span className="text-zinc-600 italic">No description provided. Click to add one...</span>}
                </div>
              )}
            </div>

            {/* Labels Tags section */}
            <div>
              <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2.5">Labels</h4>
              <div className="flex flex-wrap gap-2 items-center">
                {(task.labels || []).map((l, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full group hover:border-zinc-700 transition"
                  >
                    {l}
                    <button
                      onClick={() => handleRemoveLabel(l)}
                      className="text-zinc-500 hover:text-red-400 transition text-[10px] ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add label (Enter)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={handleAddLabel}
                  className="bg-transparent border border-dashed border-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full outline-none focus:border-zinc-650 transition placeholder-zinc-700 max-w-[120px]"
                />
              </div>
            </div>

            {/* Subtasks Checklist */}
            <div className="border-t border-zinc-900 pt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>📋</span> Checklist ({(task.subtasks || []).filter((s) => s.isCompleted).length} of {(task.subtasks || []).length})
                </h4>
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-[10px] text-zinc-500 font-mono select-none">
                    {Math.round(
                      ((task.subtasks || []).filter((s) => s.isCompleted).length /
                        (task.subtasks || []).length) *
                        100
                    )}
                    %
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="w-full h-1 bg-zinc-900 rounded-full mb-4 overflow-hidden border border-zinc-950">
                  <div
                    style={{
                      width: `${
                        ((task.subtasks || []).filter((s) => s.isCompleted).length /
                          (task.subtasks || []).length) *
                        100
                      }%`,
                    }}
                    className="h-full bg-white transition-all duration-300 rounded-full"
                  />
                </div>
              )}

              {/* Subtasks List */}
              <div className="flex flex-col gap-2.5">
                {(task.subtasks || []).map((sub, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between group bg-zinc-900/10 border border-zinc-900/30 hover:border-zinc-800 rounded-xl px-3.5 py-2 transition"
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => handleToggleSubtask(index)}
                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-white focus:ring-zinc-700 outline-none cursor-pointer accent-white transition"
                      />
                      <span
                        className={`text-xs break-words leading-relaxed ${
                          sub.isCompleted ? "line-through text-zinc-650" : "text-zinc-350 hover:text-white"
                        }`}
                      >
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(index)}
                      className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-[10px] px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Add Subtask Input */}
                <input
                  type="text"
                  placeholder="+ Add subtask checklist item (Enter)"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleAddSubtask}
                  className="bg-transparent border border-dashed border-zinc-850 focus:border-zinc-700 hover:border-zinc-750 text-zinc-400 text-xs px-3.5 py-2 rounded-xl outline-none transition placeholder-zinc-700 w-full"
                />
              </div>
            </div>

            {/* Linked Resources Integration */}
            <div className="border-t border-zinc-900 pt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>📚</span> Linked Knowledge Resources ({ (task.resources || []).length })
                </h4>
              </div>

              {/* Attached list */}
              <div className="flex flex-col gap-2 mb-3">
                {(task.resources || []).length === 0 ? (
                  <p className="text-zinc-650 text-xs italic">No references linked yet. Attach doc/repo references below.</p>
                ) : (
                  (task.resources || []).map((res) => (
                    <div
                      key={res._id}
                      className="flex items-center justify-between bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-xl px-3.5 py-2.5 transition group"
                    >
                      <a
                        href={res.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 min-w-0 flex-1 hover:text-white transition"
                      >
                        {res.favicon ? (
                          <img
                            src={res.favicon}
                            alt=""
                            className="w-3.5 h-3.5 rounded-sm bg-zinc-950 flex-shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <span>🔗</span>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-zinc-200 block truncate">{res.title}</span>
                          <span className="text-[9px] text-zinc-550 font-mono block truncate capitalize">{res.type} · {res.domain || "Reference"}</span>
                        </div>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDetachResource(res._id)}
                        className="text-zinc-650 hover:text-red-400 transition text-[10px] px-2"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Attach Selector */}
              <select
                value=""
                onChange={(e) => {
                  handleAttachResource(e.target.value);
                  e.target.value = "";
                }}
                className="w-full bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs px-3.5 py-2.5 rounded-xl outline-none transition cursor-pointer font-sans"
              >
                <option value="" disabled>+ Link/Attach saved knowledge resource...</option>
                {workspaceResources
                  .filter((wr) => !(task.resources || []).some((tr) => tr._id === wr._id))
                  .map((wr) => (
                    <option key={wr._id} value={wr._id}>
                      {wr.title} ({wr.category})
                    </option>
                  ))}
              </select>
            </div>

            {/* Task Discussion / Comments */}
            <div className="border-t border-zinc-900 pt-6">
              <h4 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>💬</span> Discussion ({comments.length})
              </h4>

              {/* Comment list */}
              <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto mb-4 scrollbar-thin pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-zinc-600 text-xs italic">
                    No comments yet. Start the task debate!
                  </div>
                ) : (
                  comments.map((c) => {
                    const isMe = c.sender?._id === user.id;
                    return (
                      <div key={c._id} className="flex gap-3 items-start">
                        <Avatar alt={c.sender?.name} size="sm" />
                        <div className="flex-1 bg-zinc-900/40 border border-zinc-900/60 rounded-2xl px-4 py-2.5 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-zinc-350">{c.sender?.name}</span>
                            <span className="text-[10px] text-zinc-600 font-mono">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed break-words">{c.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentEndRef} />
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or add details..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-zinc-700 transition text-white"
                />
                <button
                  type="submit"
                  disabled={savingComment || !newComment.trim()}
                  className="bg-white text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-200 transition disabled:opacity-40"
                >
                  Comment
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Metadata controls */}
          <div className="p-6 bg-zinc-950/40 flex flex-col gap-5 border-t md:border-t-0 border-zinc-900 overflow-y-auto">
            {/* Status Selector */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Status</label>
              <select
                value={task.status}
                onChange={(e) => saveTaskUpdates({ status: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => saveTaskUpdates({ priority: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Assignee</label>
              <select
                value={task.assignee?._id || ""}
                onChange={(e) => saveTaskUpdates({ assignee: e.target.value || null })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date selector */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Due Date</label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : ""}
                onChange={(e) => saveTaskUpdates({ dueDate: e.target.value || null })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer font-sans"
              />
            </div>

            {/* Milestone Selector/Input */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Milestone</label>
              <input
                type="text"
                placeholder="e.g. Foundation, Core Setup, Launch"
                value={task.milestone || ""}
                onChange={(e) => saveTaskUpdates({ milestone: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 font-sans"
              />
            </div>

            {/* Review Stage Selector */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Review Stage</label>
              <select
                value={task.reviewStage || ""}
                onChange={(e) => saveTaskUpdates({ reviewStage: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="">None (No review needed)</option>
                <option value="design-review">🎨 Design Review</option>
                <option value="code-review">💻 Code Review</option>
                <option value="qa-testing">🧪 QA Testing</option>
                <option value="ready-to-deploy">🚀 Ready to Deploy</option>
              </select>
            </div>

            {/* Deploy Order Selector */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Deploy Sequence Order</label>
              <input
                type="number"
                min="0"
                value={task.deployOrder || 0}
                onChange={(e) => saveTaskUpdates({ deployOrder: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2.5 text-zinc-300 outline-none focus:border-zinc-700 font-mono"
              />
            </div>

            {/* Blocker Tasks */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">🚫 Blockers ({ (task.blockers || []).length })</label>
              <div className="flex flex-col gap-1.5 mb-2">
                {(task.blockers || []).map((b, i) => (
                  <span
                    key={i}
                    className="flex items-center justify-between bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] px-2.5 py-1.5 rounded-xl font-mono"
                  >
                    <span className="truncate max-w-[150px]">{b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlocker(b)}
                      className="text-red-500 hover:text-red-300 transition text-[10px] ml-1 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  handleAddBlocker(e.target.value);
                  e.target.value = "";
                }}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-zinc-400 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="" disabled>+ Add Blocker Task...</option>
                {projectTasks
                  .filter((t) => !(task.blockers || []).includes(t.title))
                  .map((t) => (
                    <option key={t._id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Prerequisite Tasks */}
            <div>
              <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">⛓ Prerequisites (Dependencies) ({ (task.dependencies || []).length })</label>
              <div className="flex flex-col gap-1.5 mb-2">
                {(task.dependencies || []).map((d, i) => (
                  <span
                    key={i}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] px-2.5 py-1.5 rounded-xl font-mono"
                  >
                    <span className="truncate max-w-[150px]">{d}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDependency(d)}
                      className="text-zinc-500 hover:text-zinc-350 transition text-[10px] ml-1 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  handleAddDependency(e.target.value);
                  e.target.value = "";
                }}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-2 text-zinc-400 outline-none focus:border-zinc-700 cursor-pointer"
              >
                <option value="" disabled>+ Add Prerequisite Task...</option>
                {projectTasks
                  .filter((t) => !(task.dependencies || []).includes(t.title))
                  .map((t) => (
                    <option key={t._id} value={t.title}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Creator details */}
            <div className="border-t border-zinc-900 pt-4 mt-2">
              <span className="text-zinc-650 text-[10px] block uppercase font-bold mb-2">Task Creator</span>
              <div className="flex items-center gap-2">
                <Avatar alt={task.createdBy?.name || "Member"} size="xs" />
                <span className="text-xs text-zinc-400 font-medium">{task.createdBy?.name || "System"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
