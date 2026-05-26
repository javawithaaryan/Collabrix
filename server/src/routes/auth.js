import express from "express";

import {
  registerUser,
  loginUser,
  getAllUsers,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/users", authMiddleware, getAllUsers);

router.get("/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

export default router;