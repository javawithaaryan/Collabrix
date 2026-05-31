import express from 'express';
import auth from '../middleware/auth.js';
import { createWorkspace, getWorkspaces, deleteWorkspace } from '../controllers/workspaceController.js';

const router = express.Router();

// Standard workspace pipeline architecture
router.post('/', auth, createWorkspace);
router.get('/', auth, getWorkspaces);
router.delete('/:id', auth, deleteWorkspace);

export default router;