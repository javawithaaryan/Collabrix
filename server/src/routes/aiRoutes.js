import express from 'express';
import auth from '../middleware/auth.js';
import { getWorkspaceHealthAI, generateAISprint } from '../controllers/aiController.js';

const router = express.Router();

// Secure backend paths for AI generation
router.get('/insights/:workspaceId', auth, getWorkspaceHealthAI);
router.post('/sprint/generate', auth, generateAISprint);

export default router;