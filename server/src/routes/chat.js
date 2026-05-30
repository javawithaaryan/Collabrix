import { Router } from "express";

import { getMessages } from "../controllers/chatController.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, getMessages);

export default router;
