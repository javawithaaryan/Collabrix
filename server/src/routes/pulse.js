import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getWorkspacePulse, getPulseSummary } from "../controllers/pulseController.js";

const router = express.Router();

router.get("/workspace/:workspaceId", authMiddleware, getWorkspacePulse);
router.get("/workspace/:workspaceId/summary", authMiddleware, getPulseSummary);

export default router;
