import mongoose from "mongoose";

const discussionReplySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
    },

    content: {
      type: String,
      required: true,
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

    isAcceptedSolution: {
      type: Boolean,
      default: false,
    },

    parentReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionReply",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DiscussionReply = mongoose.model("DiscussionReply", discussionReplySchema);

export default DiscussionReply;
