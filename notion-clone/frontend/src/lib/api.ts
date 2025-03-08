"use client";

import {
  ApiResponse,
  AuthResponse,
  NotesResponse,
  NoteResponse,
  CollaboratorsResponse,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// 로컬 스토리지에서 토큰을 가져오는 함수
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// Generic fetch function with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // 토큰 가져오기
    const token = getAuthToken();

    // Default headers
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Include credentials for cookies
    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || "An error occurred",
      };
    }

    // 로그인 응답에서 토큰 저장
    if (endpoint === "/auth/login" && data.token) {
      localStorage.setItem("authToken", data.token);
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    return {
      error: "Network error or server is unavailable",
    };
  }
}

// Auth API
export const authAPI = {
  register: (email: string, password: string, name?: string) =>
    fetchAPI<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    fetchAPI<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => {
    // 로그아웃 시 토큰 제거
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    return fetchAPI<AuthResponse>("/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser: () => fetchAPI<AuthResponse>("/auth/me"),
};

// Notes API
export const notesAPI = {
  getAllNotes: (category?: string, search?: string) => {
    let endpoint = "/notes";
    const params = new URLSearchParams();

    if (category) params.append("category", category);
    if (search) params.append("search", search);

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    return fetchAPI<NotesResponse>(endpoint);
  },

  getNoteById: (id: number) => fetchAPI<NoteResponse>(`/notes/${id}`),

  createNote: (
    title: string,
    content?: string,
    category?: string,
    is_public?: boolean
  ) =>
    fetchAPI<NoteResponse>("/notes", {
      method: "POST",
      body: JSON.stringify({ title, content, category, is_public }),
    }),

  updateNote: (
    id: number,
    data: {
      title?: string;
      content?: string;
      category?: string;
      is_public?: boolean;
    }
  ) =>
    fetchAPI<NoteResponse>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteNote: (id: number) =>
    fetchAPI<ApiResponse<{ success: boolean }>>(`/notes/${id}`, {
      method: "DELETE",
    }),
};

// Collaborators API
export const collaboratorsAPI = {
  getCollaborativeNotes: () =>
    fetchAPI<NotesResponse>("/collaborators/shared-with-me"),

  getNoteCollaborators: (noteId: number) =>
    fetchAPI<CollaboratorsResponse>(`/collaborators/note/${noteId}`),

  addCollaborator: (
    noteId: number,
    email: string,
    permission: "read" | "write" | "admin" = "read"
  ) =>
    fetchAPI<ApiResponse<{ success: boolean }>>(
      `/collaborators/note/${noteId}`,
      {
        method: "POST",
        body: JSON.stringify({ email, permission }),
      }
    ),

  updateCollaboratorPermission: (
    noteId: number,
    userId: number,
    permission: "read" | "write" | "admin"
  ) =>
    fetchAPI<ApiResponse<{ success: boolean }>>(
      `/collaborators/note/${noteId}/user/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify({ permission }),
      }
    ),

  removeCollaborator: (noteId: number, userId: number) =>
    fetchAPI<ApiResponse<{ success: boolean }>>(
      `/collaborators/note/${noteId}/user/${userId}`,
      {
        method: "DELETE",
      }
    ),
};
