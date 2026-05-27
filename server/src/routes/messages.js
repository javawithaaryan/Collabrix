import express from "express";

import authMiddleware from "../middleware/auth.js";

import {
  sendMessage,
  getMessages,
  toggleReaction,
} from "../controllers/messageController.js";
import {
  requireMessageReadByParam,
  requireMessageWriteByBody,
  requireMessageWriteByParam,
} from "../middleware/workspaceAccess.js";

const router = express.Router();

router.post("/", authMiddleware, requireMessageWriteByBody("project"), sendMessage);
router.get("/:projectId", authMiddleware, requireMessageReadByParam("projectId"), getMessages);
router.put("/:messageId/reaction", authMiddleware, requireMessageWriteByParam("messageId"), toggleReaction);

export default router;