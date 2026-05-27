import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import messageRoutes from "./routes/messages.js";
import aiRoutes from "./routes/ai.js";
import notificationRoutes from "./routes/notifications.js";
import resourceRoutes from "./routes/resources.js";
import pulseRoutes from "./routes/pulse.js";
import collectionRoutes from "./routes/collections.js";

import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// Only log requests in dev — keeps test output clean
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (_req, res) => {
  res.json({ message: "Collabrix API running", version: "1.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/pulse", pulseRoutes);
app.use("/api/collections", collectionRoutes);

// 404 handler for any unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Must be last — catches errors thrown by controllers
app.use(errorHandler);

export default app;