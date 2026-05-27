import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    labels: {
      type: [String],
      default: [],
    },

    subtasks: [
      {
        title: { type: String, required: true, trim: true },
        isCompleted: { type: Boolean, default: false },
      }
    ],

    milestone: {
      type: String,
      default: "",
    },

    suggestedOwner: {
      type: String,
      default: "",
    },

    dependencies: {
      type: [String],
      default: [],
    },

    blockers: {
      type: [String],
      default: [],
    },

    reviewStage: {
      type: String,
      default: "",
    },

    deployOrder: {
      type: Number,
      default: 0,
    },

    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;