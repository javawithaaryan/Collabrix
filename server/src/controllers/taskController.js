import Task from "../models/Task.js";
import Comment from "../models/Comment.js";

// Create a new task
export const createTask = async (req, res, next) => {
  try {
    const { title, description, project, workspace, priority, assignee, dueDate, labels } = req.body;

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
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate("assignee createdBy", "name email avatar")
      .lean();

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

    const updated = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("assignee createdBy", "name email avatar");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Task not found" });
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

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};