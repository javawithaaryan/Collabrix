import crypto from "crypto";
import Workspace from "../models/workspace.js";
import User from "../models/User.js";
import { logPulseEvent } from "../services/pulseService.js";

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

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

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

export const createInviteLink = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const isMember = workspace.isMember(req.user._id);
    if (!isMember) return res.status(403).json({ success: false, message: "Access denied" });

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    workspace.invites.push({ token, invitedBy: req.user._id, role: "member", expiresAt });
    await workspace.save();

    res.status(200).json({ success: true, token, expiresAt });
  } catch (err) {
    next(err);
  }
};

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

    res.status(200).json({ success: true, workspace: updated });
  } catch (err) {
    next(err);
  }
};

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
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const role = workspace.getMemberRole(req.user._id);
    if (!role || (role !== "owner" && role !== "admin")) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    workspace.invites = workspace.invites.filter((inv) => inv.token !== req.params.token);
    await workspace.save();
    res.status(200).json({ success: true, message: "Invite revoked" });
  } catch (err) {
    next(err);
  }
};

export const resendInvite = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });

    const invite = workspace.invites.find((inv) => inv.token === req.params.token);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    invite.status = "pending";
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await workspace.save();
    res.status(200).json({ success: true, message: "Invite resent", expiresAt: invite.expiresAt });
  } catch (err) {
    next(err);
  }
};