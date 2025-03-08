import { collaboratorDb, noteDb } from '../db/database.js';

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
  
  return collaboratorDb.create({
    note_id,
    user_id,
    permission
  });
};

// Get all collaborators for a note
export const getCollaboratorsByNoteId = (noteId: number): Collaborator[] => {
  return collaboratorDb.getByNoteId(noteId);
};

// Get all notes a user is collaborating on
export const getCollaborativeNotes = (userId: number): any[] => {
  // 간단한 구현: 사용자가 협업자로 등록된 노트 ID 목록을 가져옵니다.
  const collaborations = collaboratorDb.getByUserId(userId);
  
  // 각 노트의 상세 정보를 가져옵니다.
  return collaborations.map(collab => {
    const note = noteDb.getById(collab.note_id);
    return note ? { ...note, permission: collab.permission } : null;
  }).filter(Boolean);
};

// Update a collaborator's permission
export const updateCollaboratorPermission = (
  noteId: number,
  userId: number,
  permission: 'read' | 'write' | 'admin'
): boolean => {
  // 간단한 구현: 해당 협업자를 찾아 권한을 업데이트합니다.
  const collaborations = collaboratorDb.getByNoteId(noteId);
  const collaboration = collaborations.find(c => c.user_id === userId);
  
  if (!collaboration) return false;
  
  return collaboratorDb.update(collaboration.id, { permission });
};

// Remove a collaborator from a note
export const removeCollaborator = (noteId: number, userId: number): boolean => {
  // 간단한 구현: 해당 협업자를 찾아 삭제합니다.
  const collaborations = collaboratorDb.getByNoteId(noteId);
  const collaboration = collaborations.find(c => c.user_id === userId);
  
  if (!collaboration) return false;
  
  return collaboratorDb.delete(collaboration.id);
};

// Check if a user is a collaborator on a note
export const isCollaborator = (noteId: number, userId: number): Collaborator | undefined => {
  const collaborations = collaboratorDb.getByNoteId(noteId);
  return collaborations.find(c => c.user_id === userId);
};

// Check if a user has write permission on a note
export const hasWritePermission = (noteId: number, userId: number): boolean => {
  const collaboration = isCollaborator(noteId, userId);
  return collaboration ? ['write', 'admin'].includes(collaboration.permission) : false;
}; 