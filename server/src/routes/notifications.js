import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getNotifications, markRead, markAllRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/:id/read", authMiddleware, markRead);
router.put("/read-all", authMiddleware, markAllRead);

export default router;
