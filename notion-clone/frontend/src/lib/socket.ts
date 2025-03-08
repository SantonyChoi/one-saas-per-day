"use client";

import { io, Socket } from 'socket.io-client';
import { ContentUpdatedEvent, CursorMovedEvent, UserJoinedEvent } from '@/types';

// Socket.IO connection
let socket: Socket | null = null;

// Initialize Socket.IO connection
export const initializeSocket = (token: string): Socket => {
  if (socket) return socket;
  
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
  
  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  return socket;
};

// Disconnect Socket.IO
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Join a note room
export const joinNote = (noteId: number): void => {
  if (socket) {
    socket.emit('join-note', noteId);
  }
};

// Leave a note room
export const leaveNote = (noteId: number): void => {
  if (socket) {
    socket.emit('leave-note', noteId);
  }
};

// Update note content
export const updateNoteContent = (noteId: number, content: string, title?: string): void => {
  if (socket) {
    socket.emit('update-content', { noteId, content, title });
  }
};

// Update cursor position
export const updateCursorPosition = (noteId: number, position: number): void => {
  if (socket) {
    socket.emit('cursor-move', { noteId, position });
  }
};

// Listen for user joined event
export const onUserJoined = (callback: (data: UserJoinedEvent) => void): void => {
  if (socket) {
    socket.on('user-joined', callback);
  }
};

// Listen for user left event
export const onUserLeft = (callback: (data: UserJoinedEvent) => void): void => {
  if (socket) {
    socket.on('user-left', callback);
  }
};

// Listen for content updated event
export const onContentUpdated = (callback: (data: ContentUpdatedEvent) => void): void => {
  if (socket) {
    socket.on('content-updated', callback);
  }
};

// Listen for cursor moved event
export const onCursorMoved = (callback: (data: CursorMovedEvent) => void): void => {
  if (socket) {
    socket.on('cursor-moved', callback);
  }
};

// Remove event listeners
export const removeEventListeners = (): void => {
  if (socket) {
    socket.off('user-joined');
    socket.off('user-left');
    socket.off('content-updated');
    socket.off('cursor-moved');
  }
}; 