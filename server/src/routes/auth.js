import express from "express";
import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  getAllUsers,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/auth.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/users", authMiddleware, getAllUsers);
router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

export default router;