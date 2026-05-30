import mongoose from "mongoose";

const resourceCollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
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
    },

    resources: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Resource",
      default: [],
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

    isPrivate: {
      type: Boolean,
      default: false,
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

const ResourceCollection = mongoose.model(
  "ResourceCollection",
  resourceCollectionSchema
);

export default ResourceCollection;
