import express from 'express';
import {
  addCollaboratorController,
  getNoteCollaborators,
  getUserCollaborativeNotes,
  updateCollaboratorPermissionController,
  removeCollaboratorController
} from '../controllers/collaborators.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all notes the user is collaborating on
router.get('/shared-with-me', getUserCollaborativeNotes);

// Add a collaborator to a note
router.post('/notes/:id/collaborators', addCollaboratorController);

// Get all collaborators for a note
router.get('/notes/:id/collaborators', getNoteCollaborators);

// Update a collaborator's permission
router.put('/notes/:id/collaborators/:userId', updateCollaboratorPermissionController);

// Remove a collaborator from a note
router.delete('/notes/:id/collaborators/:userId', removeCollaboratorController);

export default router; 