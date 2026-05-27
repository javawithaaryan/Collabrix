import mongoose from "mongoose";

const aiFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    resourceTitle: {
      type: String,
      required: true,
    },
    resourceDomain: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      enum: ["saved", "opened", "ignored", "attached", "resolved"],
      required: true,
    },
    context: {
      sprintFocus: String,
      blockers: String,
    },
  },
  {
    timestamps: true,
  }
);

// Expire logs older than 60 days
aiFeedbackSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const AiFeedback = mongoose.model("AiFeedback", aiFeedbackSchema);
export default AiFeedback;
