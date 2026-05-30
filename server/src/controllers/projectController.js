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
      .populate("members", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      status,
      roadmap,
      milestones,
      releases,
      startDate,
      endDate,
      progress,
      members,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;
    if (roadmap !== undefined) project.roadmap = roadmap;
    if (milestones !== undefined) project.milestones = milestones;
    if (releases !== undefined) project.releases = releases;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (progress !== undefined) project.progress = progress;
    if (members !== undefined) project.members = members;

    await project.save();
    
    const updated = await Project.findById(project._id)
      .populate("members", "name email avatar")
      .lean();

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    next(err);
  }
};