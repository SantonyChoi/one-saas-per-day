// 임시 메모리 데이터베이스 구현
// 실제 프로덕션에서는 사용하지 마세요!

// 타입 정의
interface User {
  id: number;
  email: string;
  password: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string | null;
  user_id: number;
  category: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface Collaborator {
  id: number;
  note_id: number;
  user_id: number;
  permission: 'read' | 'write' | 'admin';
  created_at: string;
}

// 데이터 저장소
const db: {
  users: User[];
  notes: Note[];
  collaborators: Collaborator[];
} = {
  users: [],
  notes: [],
  collaborators: []
};

// 사용자 관련 함수
export const userDb = {
  create: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): number => {
    const id = db.users.length + 1;
    const newUser = { ...user, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db.users.push(newUser);
    return id;
  },
  getByEmail: (email: string): User | undefined => {
    return db.users.find(user => user.email === email);
  },
  getById: (id: number): User | undefined => {
    return db.users.find(user => user.id === id);
  }
};

// 노트 관련 함수
export const noteDb = {
  create: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): number => {
    const id = db.notes.length + 1;
    const newNote = { ...note, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db.notes.push(newNote);
    return id;
  },
  getById: (id: number): Note | undefined => {
    return db.notes.find(note => note.id === id);
  },
  getByUserId: (userId: number): Note[] => {
    return db.notes.filter(note => note.user_id === userId);
  },
  update: (id: number, data: Partial<Note>): boolean => {
    const index = db.notes.findIndex(note => note.id === id);
    if (index !== -1) {
      db.notes[index] = { ...db.notes[index], ...data, updated_at: new Date().toISOString() };
      return true;
    }
    return false;
  },
  delete: (id: number): boolean => {
    const index = db.notes.findIndex(note => note.id === id);
    if (index !== -1) {
      db.notes.splice(index, 1);
      return true;
    }
    return false;
  }
};

// 협업자 관련 함수
export const collaboratorDb = {
  create: (collaborator: Omit<Collaborator, 'id' | 'created_at'>): number => {
    const id = db.collaborators.length + 1;
    const newCollaborator = { ...collaborator, id, created_at: new Date().toISOString() };
    db.collaborators.push(newCollaborator);
    return id;
  },
  getByNoteId: (noteId: number): Collaborator[] => {
    return db.collaborators.filter(collab => collab.note_id === noteId);
  },
  getByUserId: (userId: number): Collaborator[] => {
    return db.collaborators.filter(collab => collab.user_id === userId);
  },
  delete: (id: number): boolean => {
    const index = db.collaborators.findIndex(collab => collab.id === id);
    if (index !== -1) {
      db.collaborators.splice(index, 1);
      return true;
    }
    return false;
  },
  update: (id: number, data: Partial<Collaborator>): boolean => {
    const index = db.collaborators.findIndex(collab => collab.id === id);
    if (index !== -1) {
      db.collaborators[index] = { ...db.collaborators[index], ...data };
      return true;
    }
    return false;
  }
};

console.log('메모리 기반 데이터베이스가 초기화되었습니다.');

export default { userDb, noteDb, collaboratorDb }; 