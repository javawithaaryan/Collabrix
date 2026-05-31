import Workspace from '../models/Workspace.js';

export const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const newWorkspace = new Workspace({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'Admin' }]
    });

    const savedWorkspace = await newWorkspace.save();
    return res.status(201).json({ success: true, data: savedWorkspace });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error creating workspace', error: error.message });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user.id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('projects');
    return res.status(200).json({ success: true, data: workspaces });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error fetching workspaces', error: error.message });
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    if (workspace.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this workspace' });
    }

    await workspace.emit('cleanDelete');
    await Workspace.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Workspace and all associated records deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error deleting workspace', error: error.message });
  }
};