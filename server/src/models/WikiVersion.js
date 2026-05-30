import mongoose from "mongoose";

const wikiVersionSchema = new mongoose.Schema(
  {
    wikiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wiki",
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    contentSnapshot: {
      type: String,
      default: "",
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    changeSummary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const WikiVersion = mongoose.model("WikiVersion", wikiVersionSchema);
export default WikiVersion;
