import mongoose from "mongoose";

const pulseEventSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    actorName: {
      type: String,
      default: "System",
    },
    type: {
      type: String,
      enum: [
        "sprint_generated",
        "task_moved",
        "resource_shared",
        "workspace_created",
        "milestone_reached",
        "temporal_summary"
      ],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    importance: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    visibility: {
      type: Boolean,
      default: true,
    },
    groupingKey: {
      type: String,
      default: "",
      index: true,
    },
    metadata: {
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
      count: { type: Number, default: 1 },
      updates: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete events older than 45 days to keep DB performant
pulseEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 45 * 24 * 60 * 60 });

const PulseEvent = mongoose.model("PulseEvent", pulseEventSchema);
export default PulseEvent;
