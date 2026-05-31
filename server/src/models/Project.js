const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);