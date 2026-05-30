import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "Question",
        "Discussion",
        "Architecture Review",
        "Showcase",
        "Learning",
        "Poll",
        "Weekly Win",
      ],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Backend",
        "Frontend",
        "DevOps",
        "Security",
        "AI",
        "Cloud",
        "System Design",
        "Career",
        "Tools",
        "Random",
      ],
      default: "Discussion",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    replies: {
      type: Number,
      default: 0,
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

    acceptedReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionReply",
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    views: {
      type: Number,
      default: 0,
    },

    trending: {
      type: Boolean,
      default: false,
    },

    linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    linkedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
  },
  {
    timestamps: true,
  }
);

discussionSchema.index({
  title: "text",
  content: "text",
  tags: "text",
});

const Discussion = mongoose.model("Discussion", discussionSchema);

export default Discussion;
