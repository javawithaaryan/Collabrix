import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";

// import your routes (adjust names as per your project)
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config();

// connect database
connectDB();

const app = express();

// middleware
app.use(express.json());

// routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// error handler (MUST be after routes)
app.use(errorHandler);

// start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});