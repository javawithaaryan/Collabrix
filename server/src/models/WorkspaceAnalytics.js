import mongoose from "mongoose";

const workspaceAnalyticsSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true,
    },

    sprintHealth: {
      type: String,
      enum: ["On Track", "At Risk", "Behind", "Complete"],
      default: "On Track",
    },

    completionRate: {
      type: Number,
      default: 0,
    },

    activeProjectsCount: {
      type: Number,
      default: 0,
    },

    totalTasksCount: {
      type: Number,
      default: 0,
    },

    completedTasksCount: {
      type: Number,
      default: 0,
    },

    inProgressTasksCount: {
      type: Number,
      default: 0,
    },

    teamSize: {
      type: Number,
      default: 0,
    },

    averageTaskCompletionTime: {
      type: Number,
      default: 0,
    },

    blockers: {
      type: [String],
      default: [],
    },

    velocity: {
      type: Number,
      default: 0,
    },

    burndown: [
      {
        date: { type: Date, default: Date.now },
        completedPoints: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const WorkspaceAnalytics = mongoose.model(
  "WorkspaceAnalytics",
  workspaceAnalyticsSchema
);

export default WorkspaceAnalytics;
