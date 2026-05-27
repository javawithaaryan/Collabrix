import express from "express";

import authMiddleware from "../middleware/auth.js";
import {
  requireProjectReadByParam,
  requireProjectWriteByBody,
  requireWorkspaceReadByParam,
  requireTaskReadByParam,
  requireTaskWriteByParam,
} from "../middleware/workspaceAccess.js";

import {
  createTask,
  getTasks,
  updateTaskStatus,
  getComments,
  addComment,
  getWorkspaceTasks,
} from "../controllers/taskController.js";

const router = express.Router();

// Task CRUD
router.post("/", authMiddleware, requireProjectWriteByBody("project"), createTask);
router.get("/:projectId", authMiddleware, requireProjectReadByParam("projectId"), getTasks);
router.get("/workspace/:workspaceId", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getWorkspaceTasks);
router.put("/:taskId", authMiddleware, requireTaskWriteByParam("taskId"), updateTaskStatus);

// Comments
router.get("/:taskId/comments", authMiddleware, requireTaskReadByParam("taskId"), getComments);
router.post("/:taskId/comments", authMiddleware, requireTaskWriteByParam("taskId"), addComment);

export default router;