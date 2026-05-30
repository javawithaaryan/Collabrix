import express from "express";

import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

import authMiddleware from "../middleware/auth.js";
import {
  requireWorkspaceReadByParam,
  requireWorkspaceWriteByBody,
  requireProjectWriteByParam,
} from "../middleware/workspaceAccess.js";

const router = express.Router();

router.post("/", authMiddleware, requireWorkspaceWriteByBody("workspaceId"), createProject);

router.get("/workspace/:workspaceId", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getProjects);

router.get("/:workspaceId", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getProjects);

router.put("/:projectId", authMiddleware, requireProjectWriteByParam("projectId"), updateProject);

router.delete("/:projectId", authMiddleware, requireProjectWriteByParam("projectId"), deleteProject);

export default router;
