import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["mention", "task_assigned", "task_moved", "comment", "reaction", "invite", "sprint_generated", "task_created", "task_completed"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    // Context links
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String },
  },
  { timestamps: true }
);

// Cleanup: auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
