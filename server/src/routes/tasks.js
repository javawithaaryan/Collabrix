import express from "express";

import authMiddleware from "../middleware/auth.js";

import {
  createTask,
  getTasks,
  updateTaskStatus,
  getComments,
  addComment,
  getWorkspaceTasks,
  deleteTask,
} from "../controllers/taskController.js";

const router = express.Router();

// Task CRUD
router.post("/", authMiddleware, createTask);
router.get("/workspace/:workspaceId", authMiddleware, getWorkspaceTasks);
router.get("/:projectId", authMiddleware, getTasks);
router.put("/:taskId", authMiddleware, updateTaskStatus);
router.delete("/:taskId", authMiddleware, deleteTask);

// Comments
router.get("/:taskId/comments", authMiddleware, getComments);
router.post("/:taskId/comments", authMiddleware, addComment);

export default router;