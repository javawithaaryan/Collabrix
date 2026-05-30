import express from "express";
import {
  createWiki,
  getWorkspaceWikis,
  getWikiById,
  updateWiki,
  deleteWiki,
  archiveWiki,
  restoreWiki,
  getWikiVersions,
  restoreWikiVersion,
  duplicateWiki,
} from "../controllers/wikiController.js";
import authMiddleware from "../middleware/auth.js";
import {
  requireWorkspaceReadByParam,
  requireWorkspaceWriteByBody,
  requireWikiReadByParam,
  requireWikiWriteByParam,
} from "../middleware/workspaceAccess.js";

const router = express.Router();

router.post("/", authMiddleware, requireWorkspaceWriteByBody("workspaceId"), createWiki);
router.get("/workspace/:workspaceId", authMiddleware, requireWorkspaceReadByParam("workspaceId"), getWorkspaceWikis);

router.get("/:wikiId", authMiddleware, requireWikiReadByParam("wikiId"), getWikiById);
router.put("/:wikiId", authMiddleware, requireWikiWriteByParam("wikiId"), updateWiki);
router.delete("/:wikiId", authMiddleware, requireWikiWriteByParam("wikiId"), deleteWiki);

router.post("/:wikiId/archive", authMiddleware, requireWikiWriteByParam("wikiId"), archiveWiki);
router.post("/:wikiId/restore", authMiddleware, requireWikiWriteByParam("wikiId"), restoreWiki);
router.post("/:wikiId/duplicate", authMiddleware, requireWikiReadByParam("wikiId"), duplicateWiki); // read access to duplicate

router.get("/:wikiId/versions", authMiddleware, requireWikiReadByParam("wikiId"), getWikiVersions);
router.post("/:wikiId/versions/restore", authMiddleware, requireWikiWriteByParam("wikiId"), restoreWikiVersion);

export default router;
