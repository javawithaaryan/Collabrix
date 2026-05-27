import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  createInviteLink,
  joinViaInvite,
  getMembers,
  getPendingInvites,
  removeMember,
  getInviteInfo,
  revokeInvite,
  resendInvite,
} from "../controllers/workspaceController.js";

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);
router.get("/:id", authMiddleware, getWorkspace);
router.get("/:id/members", authMiddleware, getMembers);
router.get("/:id/invites", authMiddleware, getPendingInvites);
router.post("/:id/invite", authMiddleware, createInviteLink);
router.delete("/:id/invite/:token", authMiddleware, revokeInvite);
router.post("/:id/invite/:token/resend", authMiddleware, resendInvite);
router.post("/join/:token", authMiddleware, joinViaInvite);
router.delete("/:id/members/:userId", authMiddleware, removeMember);
router.get("/invite/:token", getInviteInfo);  // Public — no auth needed

export default router;