import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
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

    summary: {
      type: String,
      default: "",
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "backend",
        "frontend",
        "devops",
        "security",
        "auth",
        "authentication",
        "database",
        "ai",
        "cloud",
        "realtime",
        "system-design",
        "performance",
        "open-source",
        "ui-inspiration",
        "bug-fix",
        "architecture",
        "deployment",
        "other",
        "Backend",
        "Frontend",
        "DevOps",
        "Security",
        "Authentication",
        "Database",
        "AI",
        "Cloud",
        "Realtime",
        "System Design",
        "Performance",
        "Open Source",
      ],
      required: true,
      default: "other",
    },

    resourceType: {
      type: String,
      enum: [
        "GitHub Repo",
        "Documentation",
        "Article",
        "Video",
        "Tutorial",
        "Prompt",
        "Bug Fix",
        "Deployment Guide",
        "Tool",
        "Library",
        "Code Snippet",
        "Wiki",
        "code-snippet",
        "article",
        "docs"
      ],
      default: "Documentation",
    },

    type: {
      type: String,
      default: "url",
    },

    favicon: {
      type: String,
      default: "",
    },

    previewImage: {
      type: String,
      default: "",
    },

    domain: {
      type: String,
      default: "",
    },

    suggestedTags: {
      type: [String],
      default: [],
    },

    aiPrompt: {
      type: String,
      default: "",
    },

    rawMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceCollection",
      default: null,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    upvotes: {
      type: Number,
      default: 0,
    },

    upvoters: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    saves: {
      type: Number,
      default: 0,
    },

    savers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    views: {
      type: Number,
      default: 0,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        text: String,
        type: { type: String, default: "note" },
        solvedIndicator: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    usageMetadata: [
      {
        text: String,
        contextType: { type: String, default: "other" },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    linkedDiscussions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }],
    codeSnippet: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ title: "text", description: "text", tags: "text" });

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
