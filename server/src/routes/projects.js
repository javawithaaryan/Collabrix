import express from "express";

import {
  createProject,
  getProjects,
} from "../controllers/projectController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createProject);

router.get("/:workspaceId", authMiddleware, getProjects);

export default router;