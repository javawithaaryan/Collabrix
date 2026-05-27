import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  extractUrlMetadata,
  createResource,
  getResources,
  updateResource,
  deleteResource,
  toggleLike,
  addComment,
  attachToTask,
  getAiRecommendations,
  trackFeedback,
  trackView,
} from "../controllers/resourceController.js";
import {
  requireWorkspaceWriteByBody,
  requireWorkspaceReadByParam,
  requireResourceWriteByParam,
  requireResourceReadByParam,
} from "../middleware/workspaceAccess.js";

const router = express.Router();

router.post("/extract", authMiddleware, extractUrlMetadata);
router.post("/", authMiddleware, requireWorkspaceWriteByBody("workspaceId"), createResource);
router.get("/workspace/:workspaceId", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getResources);
router.put("/:id", authMiddleware, requireResourceWriteByParam("id"), updateResource);
router.delete("/:id", authMiddleware, requireResourceWriteByParam("id"), deleteResource);
router.post("/:id/like", authMiddleware, requireResourceWriteByParam("id"), toggleLike);
router.post("/:id/comment", authMiddleware, requireResourceWriteByParam("id"), addComment);
router.post("/:id/attach", authMiddleware, requireResourceWriteByParam("id"), attachToTask);
router.post("/feedback", authMiddleware, trackFeedback);
router.post("/:id/view", authMiddleware, requireResourceReadByParam("id"), trackView);
router.get("/workspace/:workspaceId/recommend", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getAiRecommendations);

export default router;
