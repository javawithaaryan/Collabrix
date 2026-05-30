import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import your route files from the routes directory
// Note: Adjust the filenames if they are named slightly differently in your folder
import workspaceRoutes from "./routes/workspace.routes.js";
// import userRoutes from "./routes/user.routes.js"; // Uncomment if you have user routes

const app = express();

// 1. Configure CORS to let your Vite frontend (port 5173) connect securely
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Global Middlewares
app.use(express.json()); // Parses incoming JSON payloads (critical for saving workspaces)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running smoothly" });
});

// 4. API Routes Mapping
// This links your frontend fetch('/api/workspaces') directly to your route controller logic
app.use("/api/workspaces", workspaceRoutes);

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Server Error Pipeline:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

export default app;