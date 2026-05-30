import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import messageRoutes from "./routes/messages.js";
import chatRoutes from "./routes/chat.js";
import aiRoutes from "./routes/ai.js";
import resourceRoutes from "./routes/resources.js";
import collectionRoutes from "./routes/collections.js";
import notificationRoutes from "./routes/notifications.js";
import pulseRoutes from "./routes/pulse.js";
import wikiRoutes from "./routes/wiki.js";
import seedRoutes from "./routes/seed.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://collabrix-beta.vercel.app",
];

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin(origin, callback) {
      /*
      |--------------------------------------------------------------------------
      | Allow requests without origin
      |--------------------------------------------------------------------------
      | Useful for:
      | - Postman
      | - server-to-server requests
      | - mobile apps
      |--------------------------------------------------------------------------
      */

      if (!origin) {
        return callback(null, true);
      }

      /*
      |--------------------------------------------------------------------------
      | Allow trusted origins
      |--------------------------------------------------------------------------
      */

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      /*
      |--------------------------------------------------------------------------
      | Reject unknown origins
      |--------------------------------------------------------------------------
      */

      return callback(
        new Error(
          `CORS blocked for origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/*
|--------------------------------------------------------------------------
| Body Parsing
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  })
);

/*
|--------------------------------------------------------------------------
| HTTP Logging
|--------------------------------------------------------------------------
| Skip logs during automated tests.
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Collabrix API running",
    version: "1.0",
  });
});

/*
|--------------------------------------------------------------------------
| API Status Route
|--------------------------------------------------------------------------
*/

app.get("/api", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Collabrix API available",
  });
});

/*
|--------------------------------------------------------------------------
| Health Check Route
|--------------------------------------------------------------------------
| Useful for:
| - Render health monitoring
| - uptime checks
| - deployment diagnostics
|--------------------------------------------------------------------------
*/

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use(
  "/api/workspaces",
  workspaceRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/tasks",
  taskRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/resources",
  resourceRoutes
);

app.use(
  "/api/collections",
  collectionRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/pulse",
  pulseRoutes
);

app.use(
  "/api/wiki",
  wikiRoutes
);

app.use(
  "/api/seed",
  seedRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Route Handler
|--------------------------------------------------------------------------
*/

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorHandler);

export default app;
