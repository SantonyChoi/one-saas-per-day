// User types
export interface User {
  id: number;
  email: string;
  name?: string;
}

// Note types
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

// Collaborator types
export interface Collaborator {
  id: number;
  note_id: number;
  user_id: number;
  email: string;
  name?: string;
  permission: 'read' | 'write' | 'admin';
}

// API response types
export interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
  [key: string]: any; // 임시로 추가하여 타입 오류 해결
}

export interface AuthResponse {
  message?: string;
  user?: User;
  token?: string;
  error?: string;
}

export interface NotesResponse {
  notes: Note[];
}

export interface NoteResponse {
  note: Note;
  collaborators?: Collaborator[];
}

export interface CollaboratorsResponse {
  collaborators: Collaborator[];
}

// Socket event types
export interface UserJoinedEvent {
  userId: number;
  email: string;
  name?: string;
}

export interface ContentUpdatedEvent {
  noteId: number;
  content: string;
  title?: string;
  userId: number;
  email: string;
  name?: string;
}

export interface CursorMovedEvent {
  userId: number;
  email: string;
  name?: string;
  position: number;
} 