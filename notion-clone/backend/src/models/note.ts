import { noteDb } from '../db/database.js';

export interface Note {
  id: number;
  title: string;
  content: string | null;
  user_id: number;
  category: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  user_id: number;
  category?: string;
  is_public?: boolean;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  category?: string;
  is_public?: boolean;
}

// Create a new note
export const createNote = (noteData: NoteInput): number => {
  return noteDb.create({
    ...noteData,
    content: noteData.content || null,
    category: noteData.category || null,
    is_public: noteData.is_public || false
  });
};

// Get a note by ID
export const getNoteById = (id: number): Note | undefined => {
  return noteDb.getById(id);
};

// Get all notes for a user
export const getNotesByUserId = (userId: number): Note[] => {
  return noteDb.getByUserId(userId);
};

// Get notes by category for a user
export const getNotesByCategory = (userId: number, category: string): Note[] => {
  return noteDb.getByUserId(userId).filter(note => note.category === category);
};

// Search notes by title or content for a user
export const searchNotes = (userId: number, query: string): Note[] => {
  const lowercaseQuery = query.toLowerCase();
  return noteDb.getByUserId(userId).filter(note => 
    note.title.toLowerCase().includes(lowercaseQuery) || 
    (note.content && note.content.toLowerCase().includes(lowercaseQuery)) ||
    (note.category && note.category.toLowerCase().includes(lowercaseQuery))
  );
};

// Update a note
export const updateNote = (id: number, noteData: NoteUpdate): boolean => {
  return noteDb.update(id, noteData);
};

// Delete a note
export const deleteNote = (id: number): boolean => {
  return noteDb.delete(id);
};

// Check if a user has access to a note
export const userHasAccessToNote = (userId: number, noteId: number): boolean => {
  const note = noteDb.getById(noteId);
  return note ? note.user_id === userId : false;
}; 