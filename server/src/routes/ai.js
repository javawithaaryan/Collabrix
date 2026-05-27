import express from "express";

import authMiddleware from "../middleware/auth.js";

import { generateTasks } from "../controllers/aiController.js";
import { generateSprint } from "../controllers/sprintController.js";
import { requireSprintWrite } from "../middleware/workspaceAccess.js";

const router = express.Router();

router.post(
  "/generate-tasks",
  authMiddleware,
  generateTasks
);

router.post("/generate-sprint", authMiddleware, requireSprintWrite, generateSprint);

export default router;