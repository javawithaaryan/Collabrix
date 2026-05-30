import mongoose from "mongoose";

const wikiSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
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
    contributors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    category: {
      type: String,
      default: "General",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
    views: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Linked Knowledge Graph
    linkedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    linkedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    linkedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],
    linkedDiscussions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discussion",
      },
    ],
    linkedSnippets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Snippet",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Wiki = mongoose.model("Wiki", wikiSchema);
export default Wiki;
