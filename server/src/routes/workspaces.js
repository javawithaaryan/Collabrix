import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  createInviteLink,
  joinViaInvite,
  getMembers,
  removeMember,
  getInviteInfo,
} from "../controllers/workspaceController.js";

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);
router.get("/:id", authMiddleware, getWorkspace);
router.get("/:id/members", authMiddleware, getMembers);
router.post("/:id/invite", authMiddleware, createInviteLink);
router.post("/join/:token", authMiddleware, joinViaInvite);
router.delete("/:id/members/:userId", authMiddleware, removeMember);
router.get("/invite/:token", getInviteInfo);  // Public — no auth needed

export default router;