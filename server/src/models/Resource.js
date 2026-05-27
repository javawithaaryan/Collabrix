import mongoose from "mongoose";

const resourceCommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ["note", "warning", "caveat", "solution"], default: "note" },
    solvedIndicator: { type: Boolean, default: false },
    reactions: [
      {
        emoji: { type: String },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      }
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

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
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["url", "github", "docs", "youtube", "tweet", "article", "code-snippet", "ai-prompt", "bug-fix", "image", "other"],
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
    codeSnippet: {
      type: String,
      default: "",
    },
    aiPrompt: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["backend", "auth", "deployment", "security", "realtime", "performance", "ui-inspiration", "ai", "bug-fix", "architecture", "database", "devops", "other"],
      default: "other",
    },
    tags: {
      type: [String],
      default: [],
    },
    suggestedTags: {
      type: [String],
      default: [],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    usageMetadata: [
      {
        text: { type: String, required: true },
        contextType: { type: String, enum: ["sprint", "task", "fix", "deploy", "other"], default: "other" },
      }
    ],
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [resourceCommentSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for search performance
resourceSchema.index({ title: "text", description: "text", tags: "text" });

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
