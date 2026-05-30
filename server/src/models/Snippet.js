import mongoose from "mongoose";

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: "javascript",
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    linkedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    }],
    linkedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
    linkedResources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
    }],
    versionHistory: [{
      code: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
  }
);

const Snippet = mongoose.model("Snippet", snippetSchema);
export default Snippet;
