import db from '../db/database.js';

export interface Collaborator {
  id: number;
  note_id: number;
  user_id: number;
  permission: 'read' | 'write' | 'admin';
  created_at: string;
}

export interface CollaboratorInput {
  note_id: number;
  user_id: number;
  permission?: 'read' | 'write' | 'admin';
}

// Add a collaborator to a note
export const addCollaborator = (collaboratorData: CollaboratorInput): number => {
  const { note_id, user_id, permission = 'read' } = collaboratorData;
  
  const stmt = db.prepare(`
    INSERT INTO collaborators (note_id, user_id, permission)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(note_id, user_id, permission);
  return result.lastInsertRowid as number;
};

// Get all collaborators for a note
export const getCollaboratorsByNoteId = (noteId: number): Collaborator[] => {
  const stmt = db.prepare(`
    SELECT c.*, u.email, u.name
    FROM collaborators c
    JOIN users u ON c.user_id = u.id
    WHERE c.note_id = ?
  `);
  
  return stmt.all(noteId) as Collaborator[];
};

// Get all notes a user is collaborating on
export const getCollaborativeNotes = (userId: number): any[] => {
  const stmt = db.prepare(`
    SELECT n.*, c.permission, u.email as owner_email, u.name as owner_name
    FROM notes n
    JOIN collaborators c ON n.id = c.note_id
    JOIN users u ON n.user_id = u.id
    WHERE c.user_id = ?
    ORDER BY n.updated_at DESC
  `);
  
  return stmt.all(userId);
};

// Update a collaborator's permission
export const updateCollaboratorPermission = (
  noteId: number,
  userId: number,
  permission: 'read' | 'write' | 'admin'
): boolean => {
  const stmt = db.prepare(`
    UPDATE collaborators
    SET permission = ?
    WHERE note_id = ? AND user_id = ?
  `);
  
  const result = stmt.run(permission, noteId, userId);
  return result.changes > 0;
};

// Remove a collaborator from a note
export const removeCollaborator = (noteId: number, userId: number): boolean => {
  const stmt = db.prepare(`
    DELETE FROM collaborators
    WHERE note_id = ? AND user_id = ?
  `);
  
  const result = stmt.run(noteId, userId);
  return result.changes > 0;
};

// Check if a user is a collaborator on a note
export const isCollaborator = (noteId: number, userId: number): Collaborator | undefined => {
  const stmt = db.prepare(`
    SELECT * FROM collaborators
    WHERE note_id = ? AND user_id = ?
  `);
  
  return stmt.get(noteId, userId) as Collaborator | undefined;
};

// Check if a user has write permission on a note
export const hasWritePermission = (noteId: number, userId: number): boolean => {
  const stmt = db.prepare(`
    SELECT permission FROM collaborators
    WHERE note_id = ? AND user_id = ?
  `);
  
  const result = stmt.get(noteId, userId) as { permission: string } | undefined;
  return result ? ['write', 'admin'].includes(result.permission) : false;
}; 