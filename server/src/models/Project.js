import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
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

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    status: {
      type: String,
      enum: ["Planning", "Active", "In Review", "Released", "Archived"],
      default: "Active",
    },

    roadmap: {
      type: String,
      default: "",
    },

    milestones: [
      {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        dueDate: { type: Date, default: null },
        status: {
          type: String,
          enum: ["Not Started", "In Progress", "Completed"],
          default: "Not Started",
        },
        progress: { type: Number, default: 0 },
      },
    ],

    releases: [
      {
        version: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: "" },
        releaseDate: { type: Date, default: null },
        status: {
          type: String,
          enum: ["Planning", "Beta", "Released"],
          default: "Planning",
        },
        features: { type: [String], default: [] },
      },
    ],

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    progress: {
      type: Number,
      default: 0,
    },

    linkedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      }
    ],

    linkedDiscussions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discussion",
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;