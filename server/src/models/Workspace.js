const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Admin', 'Member', 'Viewer'], default: 'Member' }
  }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true });

// Cascade delete middleware when a workspace is removed
WorkspaceSchema.pre('cleanDelete', async function(next) {
  try {
    const projectIds = this.projects;
    
    // Delete all comments, tasks, sprints linked to projects inside this workspace
    if (projectIds && projectIds.length > 0) {
      const Sprint = mongoose.model('Sprint');
      const Task = mongoose.model('Task');
      const Comment = mongoose.model('Comment');
      
      const sprints = await Sprint.find({ project: { $in: projectIds } });
      const sprintIds = sprints.map(s => s._id);

      const tasks = await Task.find({ project: { $in: projectIds } });
      const taskIds = tasks.map(t => t._id);

      if (taskIds.length > 0) {
        await Comment.deleteMany({ task: { $in: taskIds } });
        await Task.deleteMany({ _id: { $in: taskIds } });
      }
      if (sprintIds.length > 0) {
        await Sprint.deleteMany({ _id: { $in: sprintIds } });
      }
      await mongoose.model('Project').deleteMany({ _id: { $in: projectIds } });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);