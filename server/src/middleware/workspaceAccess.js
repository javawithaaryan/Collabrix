import Workspace from "../models/workspace.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Resource from "../models/Resource.js";
import Message from "../models/Message.js";

const READ_ROLES = ["owner", "admin", "member", "viewer"];
const WRITE_ROLES = ["owner", "admin", "member"];

async function hasWorkspaceRole(workspaceId, userId, allowedRoles) {
  if (!workspaceId) return false;
  const workspace = await Workspace.findById(workspaceId).select("members");
  if (!workspace) return false;

  const member = workspace.members.find((m) => m.user.toString() === userId.toString());
  return member ? allowedRoles.includes(member.role) : false;
}

export const requireWorkspaceReadByParam = (param = "workspaceId") => async (req, res, next) => {
  try {
    const allowed = await hasWorkspaceRole(req.params[param], req.user._id, READ_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Access denied to workspace" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireWorkspaceWriteByBody = (field = "workspaceId") => async (req, res, next) => {
  try {
    const allowed = await hasWorkspaceRole(req.body[field], req.user._id, WRITE_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Read-only role cannot modify workspace data" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireProjectReadByParam = (param = "projectId") => async (req, res, next) => {
  try {
    const project = await Project.findById(req.params[param]).select("workspace");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const allowed = await hasWorkspaceRole(project.workspace, req.user._id, READ_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Access denied to project" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireProjectWriteByBody = (field = "project") => async (req, res, next) => {
  try {
    const project = await Project.findById(req.body[field]).select("workspace");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const allowed = await hasWorkspaceRole(project.workspace, req.user._id, WRITE_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Read-only role cannot modify project data" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireTaskReadByParam = (param = "taskId") => async (req, res, next) => {
  try {
    const task = await Task.findById(req.params[param]).select("workspace project");
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const project = task.workspace ? null : await Project.findById(task.project).select("workspace");
    const workspaceId = task.workspace || project?.workspace;
    const allowed = await hasWorkspaceRole(workspaceId, req.user._id, READ_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Access denied to task" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireTaskWriteByParam = (param = "taskId") => async (req, res, next) => {
  try {
    const task = await Task.findById(req.params[param]).select("workspace project");
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    const project = task.workspace ? null : await Project.findById(task.project).select("workspace");
    const workspaceId = task.workspace || project?.workspace;
    const allowed = await hasWorkspaceRole(workspaceId, req.user._id, WRITE_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Viewers cannot modify tasks" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireResourceReadByParam = (param = "id") => async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params[param]).select("workspace");
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });
    const allowed = await hasWorkspaceRole(resource.workspace, req.user._id, READ_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Access denied to resource" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireResourceWriteByParam = (param = "id") => async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params[param]).select("workspace");
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });
    const allowed = await hasWorkspaceRole(resource.workspace, req.user._id, WRITE_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Viewers cannot modify resources" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireMessageReadByParam = (param = "projectId") => requireProjectReadByParam(param);

export const requireMessageWriteByBody = (field = "project") => requireProjectWriteByBody(field);

export const requireMessageWriteByParam = (param = "messageId") => async (req, res, next) => {
  try {
    const message = await Message.findById(req.params[param]).select("project");
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    const project = await Project.findById(message.project).select("workspace");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const allowed = await hasWorkspaceRole(project.workspace, req.user._id, WRITE_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Viewers cannot modify messages" });
    next();
  } catch (err) {
    next(err);
  }
};

export const requireSprintWrite = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.body || {};
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId && projectId) {
      const project = await Project.findById(projectId).select("workspace");
      targetWorkspaceId = project?.workspace;
    }
    const allowed = await hasWorkspaceRole(targetWorkspaceId, req.user._id, WRITE_ROLES);
    if (!allowed) return res.status(403).json({ success: false, message: "Viewers cannot generate sprints" });
    next();
  } catch (err) {
    next(err);
  }
};
