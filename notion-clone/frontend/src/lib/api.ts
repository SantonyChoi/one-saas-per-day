"use client";

import { ApiResponse, AuthResponse, NotesResponse, NoteResponse, CollaboratorsResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Generic fetch function with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Include credentials for cookies
    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };
    
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || 'An error occurred',
      };
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: 'Network error or server is unavailable',
    };
  }
}

// Auth API
export const authAPI = {
  register: (email: string, password: string, name?: string) => 
    fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
    
  login: (email: string, password: string) => 
    fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    
  logout: () => 
    fetchAPI<AuthResponse>('/auth/logout', {
      method: 'POST',
    }),
    
  getCurrentUser: () => 
    fetchAPI<AuthResponse>('/auth/me'),
};

// Notes API
export const notesAPI = {
  getAllNotes: (category?: string, search?: string) => {
    let endpoint = '/notes';
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;
    
    return fetchAPI<NotesResponse>(endpoint);
  },
  
  getNoteById: (id: number) => 
    fetchAPI<NoteResponse>(`/notes/${id}`),
    
  createNote: (title: string, content?: string, category?: string, is_public?: boolean) => 
    fetchAPI<NoteResponse>('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content, category, is_public }),
    }),
    
  updateNote: (id: number, data: { title?: string; content?: string; category?: string; is_public?: boolean }) => 
    fetchAPI<NoteResponse>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  deleteNote: (id: number) => 
    fetchAPI<ApiResponse<{ success: boolean }>>(`/notes/${id}`, {
      method: 'DELETE',
    }),
};

// Collaborators API
export const collaboratorsAPI = {
  getCollaborativeNotes: () => 
    fetchAPI<NotesResponse>('/collaborators/shared-with-me'),
    
  getNoteCollaborators: (noteId: number) => 
    fetchAPI<CollaboratorsResponse>(`/collaborators/notes/${noteId}/collaborators`),
    
  addCollaborator: (noteId: number, email: string, permission: 'read' | 'write' | 'admin' = 'read') => 
    fetchAPI<ApiResponse<{ success: boolean }>>(`/collaborators/notes/${noteId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),
    
  updateCollaboratorPermission: (noteId: number, userId: number, permission: 'read' | 'write' | 'admin') => 
    fetchAPI<ApiResponse<{ success: boolean }>>(`/collaborators/notes/${noteId}/collaborators/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ permission }),
    }),
    
  removeCollaborator: (noteId: number, userId: number) => 
    fetchAPI<ApiResponse<{ success: boolean }>>(`/collaborators/notes/${noteId}/collaborators/${userId}`, {
      method: 'DELETE',
    }),
}; 