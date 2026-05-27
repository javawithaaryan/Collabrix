import Project from "../models/Project.js";

export const createProject = async (req, res, next) => {
  try {
    const { name, description, workspaceId } = req.body;

    if (!name?.trim() || !workspaceId) {
      return res.status(400).json({ success: false, message: "Name and workspaceId are required" });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim(),
      workspace: workspaceId,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const projects = await Project.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
};