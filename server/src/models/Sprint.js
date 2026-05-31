const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  goal: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  capacity: { type: Number, default: 10 },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
}, { timestamps: true });

module.exports = mongoose.model('Sprint', SprintSchema);