import { userDb } from '../db/database.js';
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
  return userDb.create({
    email,
    password: hashedPassword,
    name: name || null
  });
};

export const getUserByEmail = (email: string): User | undefined => {
  return userDb.getByEmail(email);
};

export const getUserById = (id: number): User | undefined => {
  return userDb.getById(id);
};

export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// 이 데모 버전에서는 사용자 업데이트 기능이 구현되지 않았습니다.
// 실제 애플리케이션에서는 이 기능을 구현해야 합니다.
/*
export const updateUser = (id: number, userData: Partial<UserInput>): boolean => {
  // 구현 필요
  return false;
};

export const updatePassword = async (id: number, newPassword: string): Promise<boolean> => {
  // 구현 필요
  return false;
};
*/ 