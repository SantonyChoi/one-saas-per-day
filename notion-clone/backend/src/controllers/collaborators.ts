import { Request, Response } from 'express';
import { getNoteById } from '../models/note.js';
import {
  addCollaborator,
  getCollaboratorsByNoteId,
  getCollaborativeNotes,
  updateCollaboratorPermission,
  removeCollaborator,
  isCollaborator
} from '../models/collaborator.js';
import { getUserByEmail } from '../models/user.js';

// Add a collaborator to a note
export const addCollaboratorController = (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const { email, permission } = req.body;
    
    // Validate input
    if (isNaN(noteId) || !email) {
      return res.status(400).json({ message: 'Note ID and collaborator email are required' });
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
      return res.status(403).json({ message: 'Only the owner can add collaborators' });
    }
    
    // Get the user to add as collaborator
    const collaboratorUser = getUserByEmail(email);
    
    if (!collaboratorUser) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    // Check if user is trying to add themselves
    if (collaboratorUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot add yourself as a collaborator' });
    }
    
    // Check if user is already a collaborator
    const existingCollaborator = isCollaborator(noteId, collaboratorUser.id);
    
    if (existingCollaborator) {
      return res.status(409).json({ message: 'User is already a collaborator on this note' });
    }
    
    // Add the collaborator
    const collaboratorId = addCollaborator({
      note_id: noteId,
      user_id: collaboratorUser.id,
      permission: permission || 'read'
    });
    
    // Return success
    return res.status(201).json({
      message: 'Collaborator added successfully',
      collaborator: {
        id: collaboratorId,
        note_id: noteId,
        user_id: collaboratorUser.id,
        email: collaboratorUser.email,
        name: collaboratorUser.name,
        permission: permission || 'read'
      }
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    return res.status(500).json({ message: 'An error occurred while adding the collaborator' });
  }
};

// Get all collaborators for a note
export const getNoteCollaborators = (req: Request, res: Response) => {
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
      return res.status(403).json({ message: 'Only the owner can view collaborators' });
    }
    
    // Get the collaborators
    const collaborators = getCollaboratorsByNoteId(noteId);
    
    // Return the collaborators
    return res.status(200).json({ collaborators });
  } catch (error) {
    console.error('Get collaborators error:', error);
    return res.status(500).json({ message: 'An error occurred while retrieving collaborators' });
  }
};

// Get all notes the user is collaborating on
export const getUserCollaborativeNotes = (req: Request, res: Response) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the collaborative notes
    const notes = getCollaborativeNotes(req.user.id);
    
    // Return the notes
    return res.status(200).json({ notes });
  } catch (error) {
    console.error('Get collaborative notes error:', error);
    return res.status(500).json({ message: 'An error occurred while retrieving collaborative notes' });
  }
};

// Update a collaborator's permission
export const updateCollaboratorPermissionController = (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { permission } = req.body;
    
    // Validate input
    if (isNaN(noteId) || isNaN(userId) || !permission) {
      return res.status(400).json({ message: 'Note ID, user ID, and permission are required' });
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
      return res.status(403).json({ message: 'Only the owner can update collaborator permissions' });
    }
    
    // Check if the collaborator exists
    const collaborator = isCollaborator(noteId, userId);
    
    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }
    
    // Update the permission
    const success = updateCollaboratorPermission(noteId, userId, permission as 'read' | 'write' | 'admin');
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to update collaborator permission' });
    }
    
    // Return success
    return res.status(200).json({
      message: 'Collaborator permission updated successfully'
    });
  } catch (error) {
    console.error('Update collaborator permission error:', error);
    return res.status(500).json({ message: 'An error occurred while updating the collaborator permission' });
  }
};

// Remove a collaborator from a note
export const removeCollaboratorController = (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    // Validate input
    if (isNaN(noteId) || isNaN(userId)) {
      return res.status(400).json({ message: 'Note ID and user ID are required' });
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
      return res.status(403).json({ message: 'Only the owner can remove collaborators' });
    }
    
    // Check if the collaborator exists
    const collaborator = isCollaborator(noteId, userId);
    
    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }
    
    // Remove the collaborator
    const success = removeCollaborator(noteId, userId);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to remove collaborator' });
    }
    
    // Return success
    return res.status(200).json({
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return res.status(500).json({ message: 'An error occurred while removing the collaborator' });
  }
}; 