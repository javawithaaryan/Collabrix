import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { taskService } from "../services/task.service";
import { useSocket } from "./SocketContext";
import { useWorkspace } from "./WorkspaceContext";

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { activeWorkspaceId } = useWorkspace();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const fetchWorkspaceTasks = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const data = await taskService.getTasksByWorkspace(activeWorkspaceId);
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load workspace tasks:", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchWorkspaceTasks();
    } else {
      setTasks([]);
    }
  }, [activeWorkspaceId, fetchWorkspaceTasks]);

  // Socket listener for realtime task additions & moves
  useEffect(() => {
    if (!socket) return;

    const onTaskCreated = ({ task }) => {
      if (task) {
        setTasks((prev) => {
          const exists = prev.some((t) => t._id === task._id);
          if (!exists) return [task, ...prev];
          return prev;
        });
      }
    };

    const onTaskMoved = ({ taskId, newStatus }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
      );
    };

    const onBulkUpdate = () => {
      fetchWorkspaceTasks();
    };

    socket.on("task:created", onTaskCreated);
    socket.on("task:moved", onTaskMoved);
    socket.on("task:bulk-update", onBulkUpdate);
    socket.on("receive-task-update", onBulkUpdate);

    return () => {
      socket.off("task:created", onTaskCreated);
      socket.off("task:moved", onTaskMoved);
      socket.off("task:bulk-update", onBulkUpdate);
      socket.off("receive-task-update", onBulkUpdate);
    };
  }, [socket, fetchWorkspaceTasks]);

  // Optimistic UI updates helper
  const moveTaskOptimistically = useCallback(async (taskId, newStatus, actorName) => {
    // 1. Save original state
    const originalTasks = [...tasks];

    // 2. Perform optimistic update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      // Sync task updates via socket
      if (socket) {
        socket.emit("task-moved", {
          projectId: updated.project,
          taskId,
          newStatus,
          actorName,
          taskTitle: updated.title,
        });
      }
    } catch (err) {
      console.error("Optimistic task move failed, rolling back:", err.message);
      // Rollback on error
      setTasks(originalTasks);
    }
  }, [tasks, socket]);

  // Custom filters applicability helper
  const getFilteredTasks = useCallback(() => {
    return tasks.filter((task) => {
      const titleStr = task.title || "";
      const descStr = task.description || "";
      const query = searchQuery.toLowerCase();
      
      const matchesSearch =
        titleStr.toLowerCase().includes(query) ||
        descStr.toLowerCase().includes(query) ||
        (task.labels || []).some((l) => l.toLowerCase().includes(query));

      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

      let matchesAssignee = true;
      if (assigneeFilter === "unassigned") {
        matchesAssignee = !task.assignee;
      } else if (assigneeFilter === "me") {
        const userId = socket?.query?.userId || "";
        matchesAssignee = task.assignee === userId || task.assignee?._id === userId;
      }

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter, socket]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        searchQuery,
        priorityFilter,
        assigneeFilter,
        setSearchQuery,
        setPriorityFilter,
        setAssigneeFilter,
        fetchWorkspaceTasks,
        moveTaskOptimistically,
        getFilteredTasks,
        setTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
export default TaskContext;
