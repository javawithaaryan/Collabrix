const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['Todo', 'In Progress', 'In Review', 'Done'], default: 'Todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);