import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    summary: {
      type: String,
      required: true,
    },

    fullContent: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "AI News",
        "Startup Trends",
        "Open Source",
        "Cloud News",
        "Sprint Health",
        "Team Progress",
        "Blockers",
        "Recommendations",
      ],
      required: true,
    },

    section: {
      type: String,
      enum: ["Tech World", "Workspace Insights"],
      required: true,
    },

    whyItMatters: {
      type: String,
      default: "",
    },

    impact: {
      type: String,
      default: "",
    },

    suggestedAction: {
      type: String,
      default: "",
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },

    source: {
      type: String,
      default: "",
    },

    sourceUrl: {
      type: String,
      default: "",
    },

    views: {
      type: Number,
      default: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Insight = mongoose.model("Insight", insightSchema);

export default Insight;
