import db from '../db/database.js';

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
  const { title, content, user_id, category, is_public } = noteData;
  
  const stmt = db.prepare(`
    INSERT INTO notes (title, content, user_id, category, is_public)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    title,
    content || null,
    user_id,
    category || null,
    is_public !== undefined ? is_public : false
  );
  
  return result.lastInsertRowid as number;
};

// Get a note by ID
export const getNoteById = (id: number): Note | undefined => {
  const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
  return stmt.get(id) as Note | undefined;
};

// Get all notes for a user
export const getNotesByUserId = (userId: number): Note[] => {
  const stmt = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC');
  return stmt.all(userId) as Note[];
};

// Get notes by category for a user
export const getNotesByCategory = (userId: number, category: string): Note[] => {
  const stmt = db.prepare('SELECT * FROM notes WHERE user_id = ? AND category = ? ORDER BY updated_at DESC');
  return stmt.all(userId, category) as Note[];
};

// Search notes by title or content for a user
export const searchNotes = (userId: number, query: string): Note[] => {
  const searchQuery = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM notes 
    WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) 
    ORDER BY updated_at DESC
  `);
  
  return stmt.all(userId, searchQuery, searchQuery) as Note[];
};

// Update a note
export const updateNote = (id: number, noteData: NoteUpdate): boolean => {
  const { title, content, category, is_public } = noteData;
  
  const stmt = db.prepare(`
    UPDATE notes
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        is_public = COALESCE(?, is_public),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const result = stmt.run(
    title,
    content,
    category,
    is_public !== undefined ? is_public : undefined,
    id
  );
  
  return result.changes > 0;
};

// Delete a note
export const deleteNote = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

// Check if a user has access to a note
export const userHasAccessToNote = (userId: number, noteId: number): boolean => {
  // Check if the user is the owner of the note
  const ownerStmt = db.prepare(`
    SELECT 1 FROM notes WHERE id = ? AND user_id = ?
  `);
  
  const isOwner = ownerStmt.get(noteId, userId);
  if (isOwner) return true;
  
  // Check if the user is a collaborator
  const collaboratorStmt = db.prepare(`
    SELECT 1 FROM collaborators WHERE note_id = ? AND user_id = ?
  `);
  
  const isCollaborator = collaboratorStmt.get(noteId, userId);
  if (isCollaborator) return true;
  
  // Check if the note is public
  const publicStmt = db.prepare(`
    SELECT 1 FROM notes WHERE id = ? AND is_public = 1
  `);
  
  const isPublic = publicStmt.get(noteId);
  return !!isPublic;
}; 