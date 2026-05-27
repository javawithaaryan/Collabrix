import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createCollection,
  getCollections,
  toggleFollowCollection,
  updateCollectionOrder,
} from "../controllers/collectionController.js";

const router = express.Router();

router.post("/", authMiddleware, createCollection);
router.get("/workspace/:workspaceId", authMiddleware, getCollections);
router.post("/:id/follow", authMiddleware, toggleFollowCollection);
router.put("/:id/order", authMiddleware, updateCollectionOrder);

export default router;
