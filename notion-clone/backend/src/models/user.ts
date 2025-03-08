import db from '../db/database.js';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  email: string;
  password: string;
  name?: string;
}

export const createUser = async (userData: UserInput): Promise<number> => {
  const { email, password, name } = userData;
  
  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // Insert the user into the database
  const stmt = db.prepare(`
    INSERT INTO users (email, password, name)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(email, hashedPassword, name || null);
  return result.lastInsertRowid as number;
};

export const getUserByEmail = (email: string): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
};

export const getUserById = (id: number): User | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
};

export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const updateUser = (id: number, userData: Partial<UserInput>): boolean => {
  const { email, name } = userData;
  
  // Update the user in the database
  const stmt = db.prepare(`
    UPDATE users
    SET email = COALESCE(?, email),
        name = COALESCE(?, name),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const result = stmt.run(email, name, id);
  return result.changes > 0;
};

export const updatePassword = async (id: number, newPassword: string): Promise<boolean> => {
  // Hash the new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  // Update the password in the database
  const stmt = db.prepare(`
    UPDATE users
    SET password = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  const result = stmt.run(hashedPassword, id);
  return result.changes > 0;
}; 