import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member", "viewer"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["admin", "member", "viewer"], default: "member" },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [memberSchema],
    invites: [inviteSchema],
  },
  { timestamps: true }
);

// Helper: Check if a userId is a member
workspaceSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

// Helper: Get a member's role
workspaceSchema.methods.getMemberRole = function (userId) {
  const m = this.members.find((m) => m.user.toString() === userId.toString());
  return m ? m.role : null;
};

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;