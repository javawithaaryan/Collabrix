import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import Project from "../models/Project.js";
import { logPulseEvent } from "../services/pulseService.js";
import { notifyWorkspaceMembers, createNotification } from "./notificationController.js";

// Create a new task
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      project,
      workspace,
      priority,
      assignee,
      dueDate,
      labels,
      subtasks,
      milestone,
      suggestedOwner,
      dependencies,
      blockers,
      reviewStage,
      deployOrder,
    } = req.body;

    if (!title?.trim() || !project) {
      return res.status(400).json({ success: false, message: "Title and project are required" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      project,
      workspace,
      priority: priority || "medium",
      assignee: assignee || null,
      dueDate: dueDate || null,
      labels: labels || [],
      subtasks: subtasks || [],
      milestone: milestone || "",
      suggestedOwner: suggestedOwner || "",
      dependencies: dependencies || [],
      blockers: blockers || [],
      reviewStage: reviewStage || "",
      deployOrder: deployOrder || 0,
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee createdBy", "name email avatar")
      .populate("resources")
      .lean();

    // Trigger Task Created Notification
    try {
      let wsId = populated.workspace;
      if (!wsId) {
        const projectObj = await Project.findById(populated.project);
        wsId = projectObj?.workspace;
      }
      if (wsId) {
        notifyWorkspaceMembers({
          workspaceId: wsId,
          type: "task_created",
          title: "New Task Created",
          message: `${req.user?.name} created task "${populated.title}"`,
          priority: "low",
          projectId: populated.project,
          taskId: populated._id,
          actorId: req.user?._id,
          actorName: req.user?.name,
          app: req.app,
        });
      }
    } catch (notifErr) {
      console.error("[TaskNotification] Failed to notify task creation:", notifErr.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// Get all tasks for a project
export const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({ project: projectId })
      .populate("assignee createdBy", "name email avatar")
      .populate("resources")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

// Update task details (status, assignee, description, labels, due date, etc.)
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ["todo", "in-progress", "done"];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
    }

    const originalTask = await Task.findById(taskId);
    if (!originalTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updated = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("assignee createdBy", "name email avatar").populate("resources");

    // If status has changed, log a high-fidelity Pulse event and notify workspace
    if (updates.status && updates.status !== originalTask.status) {
      try {
        let wsId = updated.workspace;
        if (!wsId) {
          const project = await Project.findById(updated.project);
          wsId = project?.workspace;
        }

        if (wsId) {
          await logPulseEvent({
            workspaceId: wsId,
            actorId: req.user?._id,
            actorName: req.user?.name,
            type: "task_moved",
            content: `${req.user?.name} moved task "${updated.title}" to ${updates.status}`,
            importance: "medium",
            metadata: {
              taskId: updated._id,
              projectId: updated.project,
              taskTitle: updated.title,
              columnName: updates.status,
            },
            io: req.app.get("io"),
          });

          // Trigger Workspace Notification
          notifyWorkspaceMembers({
            workspaceId: wsId,
            type: updates.status === "done" ? "task_completed" : "task_moved",
            title: updates.status === "done" ? "Task Completed! 🎉" : "Task Status Moved",
            message: `${req.user?.name} moved task "${updated.title}" to ${updates.status}`,
            priority: updates.status === "done" ? "high" : "medium",
            projectId: updated.project,
            taskId: updated._id,
            actorId: req.user?._id,
            actorName: req.user?.name,
            app: req.app,
          });
        }
      } catch (pulseErr) {
        console.error("[TaskPulse] Event logging failed:", pulseErr.message);
      }
    }

    // If assignee has changed, send a personal notification to the new assignee
    if (updates.assignee && updates.assignee !== originalTask.assignee?.toString()) {
      try {
        let wsId = updated.workspace;
        if (!wsId) {
          const project = await Project.findById(updated.project);
          wsId = project?.workspace;
        }

        createNotification({
          userId: updates.assignee,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `${req.user?.name} assigned "${updated.title}" to you`,
          priority: "high",
          projectId: updated.project,
          taskId: updated._id,
          workspaceId: wsId,
          actorId: req.user?._id,
          actorName: req.user?.name,
          io: req.app.get("io"),
        });
      } catch (assignErr) {
        console.error("[TaskAssignNotification] Failed to send assignment alert:", assignErr.message);
      }
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Get comments for a specific task
export const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};

// Add a comment to a task
export const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const comment = await Comment.create({
      task: taskId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await Comment.findById(comment._id)
      .populate("sender", "name email avatar")
      .lean();

    // Trigger Comment Notification
    try {
      const taskObj = await Task.findById(taskId);
      if (taskObj) {
        let wsId = taskObj.workspace;
        if (!wsId) {
          const project = await Project.findById(taskObj.project);
          wsId = project?.workspace;
        }

        if (wsId) {
          notifyWorkspaceMembers({
            workspaceId: wsId,
            type: "comment",
            title: "New Task Comment",
            message: `${req.user?.name} commented on "${taskObj.title}"`,
            priority: "medium",
            projectId: taskObj.project,
            taskId: taskObj._id,
            actorId: req.user?._id,
            actorName: req.user?.name,
            app: req.app,
          });
        }
      }
    } catch (notifErr) {
      console.error("[CommentNotification] Failed to notify comment creation:", notifErr.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// Get all tasks in a workspace
export const getWorkspaceTasks = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const tasks = await Task.find({ workspace: workspaceId })
      .populate("assignee createdBy", "name email avatar")
      .populate("resources")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};