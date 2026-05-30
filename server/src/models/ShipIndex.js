import mongoose from "mongoose";

const shipIndexSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    level: {
      type: String,
      enum: ["Starter", "Builder", "Architect", "Legend"],
      default: "Starter",
    },

    sharedResources: {
      type: Number,
      default: 0,
    },

    helpfulAnswers: {
      type: Number,
      default: 0,
    },

    acceptedSolutions: {
      type: Number,
      default: 0,
    },

    popularPosts: {
      type: Number,
      default: 0,
    },

    communityContributions: {
      type: Number,
      default: 0,
    },

    breakdown: {
      resources: { type: Number, default: 0 },
      answers: { type: Number, default: 0 },
      solutions: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      contributions: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const ShipIndex = mongoose.model("ShipIndex", shipIndexSchema);

export default ShipIndex;
