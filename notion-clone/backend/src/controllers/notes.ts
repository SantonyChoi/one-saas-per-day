import { Request, Response } from 'express';
import {
  createNote,
  getNoteById,
  getNotesByUserId,
  getNotesByCategory,
  searchNotes,
  updateNote,
  deleteNote,
  userHasAccessToNote
} from '../models/note.js';
import { getCollaboratorsByNoteId, hasWritePermission } from '../models/collaborator.js';

// Create a new note
export const createNewNote = (req: Request, res: Response) => {
  try {
    const { title, content, category, is_public } = req.body;
    
    // Validate input
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Create the note
    const noteId = createNote({
      title,
      content,
      user_id: req.user.id,
      category,
      is_public
    });
    
    // Return the created note
    return res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: noteId,
        title,
        content,
        category,
        is_public: is_public || false
      }
    });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ message: 'An error occurred while creating the note' });
  }
};

// Get a note by ID
export const getNoteByIdController = (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    
    // Validate input
    if (isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the note
    const note = getNoteById(noteId);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user has access to the note
    if (!userHasAccessToNote(req.user.id, noteId)) {
      return res.status(403).json({ message: 'You do not have access to this note' });
    }
    
    // Get collaborators if the user is the owner
    let collaborators = [];
    if (note.user_id === req.user.id) {
      collaborators = getCollaboratorsByNoteId(noteId);
    }
    
    // Return the note
    return res.status(200).json({
      note,
      collaborators
    });
  } catch (error) {
    console.error('Get note error:', error);
    return res.status(500).json({ message: 'An error occurred while retrieving the note' });
  }
};

// Get all notes for the current user
export const getUserNotes = (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get query parameters
    const category = req.query.category as string;
    const searchQuery = req.query.search as string;
    
    let notes;
    
    // Filter notes based on query parameters
    if (searchQuery) {
      notes = searchNotes(req.user.id, searchQuery);
    } else if (category) {
      notes = getNotesByCategory(req.user.id, category);
    } else {
      notes = getNotesByUserId(req.user.id);
    }
    
    // Return the notes
    return res.status(200).json({ notes });
  } catch (error) {
    console.error('Get notes error:', error);
    return res.status(500).json({ message: 'An error occurred while retrieving notes' });
  }
};

// Update a note
export const updateNoteController = (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const { title, content, category, is_public } = req.body;
    
    // Validate input
    if (isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the note
    const note = getNoteById(noteId);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user is the owner or has write permission
    if (note.user_id !== req.user.id && !hasWritePermission(noteId, req.user.id)) {
      return res.status(403).json({ message: 'You do not have permission to update this note' });
    }
    
    // Update the note
    const success = updateNote(noteId, {
      title,
      content,
      category,
      is_public
    });
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to update note' });
    }
    
    // Return success
    return res.status(200).json({
      message: 'Note updated successfully',
      note: {
        ...note,
        title: title || note.title,
        content: content !== undefined ? content : note.content,
        category: category !== undefined ? category : note.category,
        is_public: is_public !== undefined ? is_public : note.is_public
      }
    });
  } catch (error) {
    console.error('Update note error:', error);
    return res.status(500).json({ message: 'An error occurred while updating the note' });
  }
};

// Delete a note
export const deleteNoteController = (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    
    // Validate input
    if (isNaN(noteId)) {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the note
    const note = getNoteById(noteId);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user is the owner
    if (note.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this note' });
    }
    
    // Delete the note
    const success = deleteNote(noteId);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to delete note' });
    }
    
    // Return success
    return res.status(200).json({
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ message: 'An error occurred while deleting the note' });
  }
}; 