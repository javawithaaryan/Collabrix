import express from "express";

import {
  createProject,
  getProjects,
} from "../controllers/projectController.js";

import authMiddleware from "../middleware/auth.js";
import {
  requireWorkspaceReadByParam,
  requireWorkspaceWriteByBody,
} from "../middleware/workspaceAccess.js";

const router = express.Router();

router.post("/", authMiddleware, requireWorkspaceWriteByBody("workspaceId"), createProject);

router.get("/:workspaceId", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getProjects);

export default router;