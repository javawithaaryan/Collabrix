import crypto from "crypto";
import Workspace from "../models/workspace.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Message from "../models/Message.js";
import { logPulseEvent } from "../services/pulseService.js";

// Create workspace — creator becomes owner + first member
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Workspace name is required" });

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim() || "",
      owner: req.user._id,
      members: [{ user: req.user._id, role: "owner", joinedAt: new Date() }],
    });

    const populated = await Workspace.findById(workspace._id)
      .populate("members.user", "name email")
      .populate("owner", "name email")
      .lean();

    await logPulseEvent({
      workspaceId: workspace._id,
      actorId: req.user._id,
      actorName: req.user.name,
      type: "workspace_created",
      content: `${req.user.name} created workspace "${workspace.name}"`,
      importance: "high",
      io: req.app.get("io"),
    });

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// Get all workspaces the current user is a member of
export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ "members.user": req.user._id })
      .populate("members.user", "name email")
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(workspaces);
  } catch (err) {
    next(err);
  }
};

// Get single workspace with members
export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("members.user", "name email")
      .populate("owner", "name email")
      .lean();

    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const isMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: "Access denied" });

    res.status(200).json(workspace);
  } catch (err) {
    next(err);
  }
};

// Generate invite link (returns token)
export const createInviteLink = async (req, res, next) => {
  try {
    const { role = "member", email = "" } = req.body || {};
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const requesterRole = workspace.getMemberRole(req.user._id);
    if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
      return res.status(403).json({ success: false, message: "Only owners and admins can send invites" });
    }

    const normalizedRole = ["admin", "member", "viewer"].includes(role) ? role : "member";
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    workspace.invites.push({
      token,
      invitedBy: req.user._id,
      role: normalizedRole,
      email: normalizedEmail || undefined,
      expiresAt,
      status: "pending",
    });
    await workspace.save();

    res.status(200).json({ success: true, token, expiresAt, role: normalizedRole, email: normalizedEmail || null });
  } catch (err) {
    next(err);
  }
};

// Join workspace via invite token
export const joinViaInvite = async (req, res, next) => {
  try {
    const { token } = req.params;

    const workspace = await Workspace.findOne({ "invites.token": token })
      .populate("members.user", "name email")
      .populate("owner", "name email");

    if (!workspace) return res.status(404).json({ success: false, message: "Invalid invite link" });

    const invite = workspace.invites.find((inv) => inv.token === token);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (invite.status === "expired" || (invite.expiresAt && new Date() > invite.expiresAt)) {
      invite.status = "expired";
      await workspace.save();
      return res.status(410).json({ success: false, message: "Invite link has expired" });
    }

    // Already a member?
    const alreadyMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(200).json({ success: true, workspace, alreadyMember: true, message: "You are already a member" });
    }

    workspace.members.push({ user: req.user._id, role: invite.role || "member", joinedAt: new Date() });
    invite.status = "accepted";
    await workspace.save();

    const updated = await Workspace.findById(workspace._id)
      .populate("members.user", "name email")
      .populate("owner", "name email")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${workspace._id}`).emit("workspace:member-joined", {
        workspaceId: workspace._id,
        member: {
          id: req.user._id,
          name: req.user.name,
          role: invite.role || "member",
        },
      });
    }

    await logPulseEvent({
      workspaceId: workspace._id,
      actorId: req.user._id,
      actorName: req.user.name,
      type: "workspace_created",
      content: `${req.user.name} joined the workspace`,
      importance: "medium",
      metadata: {},
      io,
    });

    const workspaceProjects = await Project.find({ workspace: workspace._id }).select("_id");
    if (workspaceProjects.length > 0) {
      const systemText = `${req.user.name} joined the workspace as ${invite.role || "member"}.`;
      await Message.insertMany(
        workspaceProjects.map((project) => ({
          project: project._id,
          sender: null,
          text: systemText,
          isSystem: true,
          reactions: [],
        }))
      );
    }

    res.status(200).json({ success: true, workspace: updated });
  } catch (err) {
    next(err);
  }
};

// Get workspace members
export const getMembers = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("members.user", "name email")
      .lean();

    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const isMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: "Access denied" });

    res.status(200).json(workspace.members);
  } catch (err) {
    next(err);
  }
};

export const getPendingInvites = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id).lean();
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: "Access denied" });

    const invites = (workspace.invites || [])
      .filter((i) => i.status === "pending" && (!i.expiresAt || new Date(i.expiresAt) > new Date()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(invites);
  } catch (err) {
    next(err);
  }
};

// Remove a member (owner/admin only)
export const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const requesterRole = workspace.getMemberRole(req.user._id);
    if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
      return res.status(403).json({ success: false, message: "Only admins can remove members" });
    }

    const targetId = req.params.userId;
    if (workspace.owner.toString() === targetId) {
      return res.status(400).json({ success: false, message: "Cannot remove workspace owner" });
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== targetId);
    await workspace.save();

    res.status(200).json({ success: true, message: "Member removed" });
  } catch (err) {
    next(err);
  }
};

// Get invite info (preview before joining)
export const getInviteInfo = async (req, res, next) => {
  try {
    const { token } = req.params;
    const workspace = await Workspace.findOne({ "invites.token": token })
      .populate("owner", "name")
      .lean();

    if (!workspace) return res.status(404).json({ success: false, message: "Invalid invite" });

    const invite = workspace.invites.find((i) => i.token === token);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    const expired = invite.status === "expired" || (invite.expiresAt && new Date() > new Date(invite.expiresAt));

    res.status(200).json({
      success: true,
      workspaceName: workspace.name,
      ownerName: workspace.owner?.name,
      memberCount: workspace.members.length,
      role: invite.role,
      expired,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

export const revokeInvite = async (req, res, next) => {
  try {
    const { id, token } = req.params;
    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const requesterRole = workspace.getMemberRole(req.user._id);
    if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
      return res.status(403).json({ success: false, message: "Only owners and admins can revoke invites" });
    }

    const invite = workspace.invites.find((i) => i.token === token);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    invite.status = "expired";
    await workspace.save();

    res.status(200).json({ success: true, message: "Invite revoked" });
  } catch (err) {
    next(err);
  }
};

export const resendInvite = async (req, res, next) => {
  try {
    const { id, token } = req.params;
    const workspace = await Workspace.findById(id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const requesterRole = workspace.getMemberRole(req.user._id);
    if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
      return res.status(403).json({ success: false, message: "Only owners and admins can resend invites" });
    }

    const invite = workspace.invites.find((i) => i.token === token);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    invite.status = "pending";
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await workspace.save();

    res.status(200).json({
      success: true,
      token: invite.token,
      expiresAt: invite.expiresAt,
      role: invite.role,
      email: invite.email || null,
    });
  } catch (err) {
    next(err);
  }
};