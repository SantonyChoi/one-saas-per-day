import express from 'express';
import {
  createNewNote,
  getNoteByIdController,
  getUserNotes,
  updateNoteController,
  deleteNoteController
} from '../controllers/notes.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new note
router.post('/', createNewNote);

// Get all notes for the current user
router.get('/', getUserNotes);

// Get a note by ID
router.get('/:id', getNoteByIdController);

// Update a note
router.put('/:id', updateNoteController);

// Delete a note
router.delete('/:id', deleteNoteController);

export default router; 