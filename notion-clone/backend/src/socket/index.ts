import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { getUserById } from '../models/user.js';
import { getNoteById, updateNote, userHasAccessToNote } from '../models/note.js';
import { hasWritePermission } from '../models/collaborator.js';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Initialize Socket.IO
export const initializeSocketIO = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      
      // Get the user from the database
      const user = getUserById(decoded.id);
      
      if (!user) {
        return next(new Error('Invalid token'));
      }
      
      // Attach the user to the socket
      socket.data.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      };
      
      next();
    } catch (error) {
      return next(new Error('Invalid or expired token'));
    }
  });
  
  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.email}`);
    
    // Join a note room
    socket.on('join-note', async (noteId: number) => {
      try {
        // Check if the note exists
        const note = getNoteById(noteId);
        
        if (!note) {
          socket.emit('error', { message: 'Note not found' });
          return;
        }
        
        // Check if the user has access to the note
        if (!userHasAccessToNote(socket.data.user.id, noteId)) {
          socket.emit('error', { message: 'You do not have access to this note' });
          return;
        }
        
        // Join the note room
        socket.join(`note:${noteId}`);
        
        // Notify other users in the room
        socket.to(`note:${noteId}`).emit('user-joined', {
          userId: socket.data.user.id,
          email: socket.data.user.email,
          name: socket.data.user.name
        });
        
        // Send the current note content to the user
        socket.emit('note-data', { note });
        
        console.log(`User ${socket.data.user.email} joined note ${noteId}`);
      } catch (error) {
        console.error('Error joining note:', error);
        socket.emit('error', { message: 'An error occurred while joining the note' });
      }
    });
    
    // Leave a note room
    socket.on('leave-note', (noteId: number) => {
      socket.leave(`note:${noteId}`);
      
      // Notify other users in the room
      socket.to(`note:${noteId}`).emit('user-left', {
        userId: socket.data.user.id,
        email: socket.data.user.email,
        name: socket.data.user.name
      });
      
      console.log(`User ${socket.data.user.email} left note ${noteId}`);
    });
    
    // Handle note content updates
    socket.on('update-content', async (data: { noteId: number; content: string; title?: string }) => {
      try {
        const { noteId, content, title } = data;
        
        // Check if the note exists
        const note = getNoteById(noteId);
        
        if (!note) {
          socket.emit('error', { message: 'Note not found' });
          return;
        }
        
        // Check if the user has write access to the note
        const isOwner = note.user_id === socket.data.user.id;
        const canWrite = isOwner || hasWritePermission(noteId, socket.data.user.id);
        
        if (!canWrite) {
          socket.emit('error', { message: 'You do not have permission to edit this note' });
          return;
        }
        
        // Update the note in the database
        const updateData: { content: string; title?: string } = { content };
        if (title) updateData.title = title;
        
        const success = updateNote(noteId, updateData);
        
        if (!success) {
          socket.emit('error', { message: 'Failed to update note' });
          return;
        }
        
        // Broadcast the update to all users in the room except the sender
        socket.to(`note:${noteId}`).emit('content-updated', {
          noteId,
          content,
          title,
          userId: socket.data.user.id,
          email: socket.data.user.email,
          name: socket.data.user.name
        });
        
        console.log(`User ${socket.data.user.email} updated note ${noteId}`);
      } catch (error) {
        console.error('Error updating note:', error);
        socket.emit('error', { message: 'An error occurred while updating the note' });
      }
    });
    
    // Handle cursor position updates
    socket.on('cursor-move', (data: { noteId: number; position: number }) => {
      const { noteId, position } = data;
      
      // Broadcast the cursor position to all users in the room except the sender
      socket.to(`note:${noteId}`).emit('cursor-moved', {
        userId: socket.data.user.id,
        email: socket.data.user.email,
        name: socket.data.user.name,
        position
      });
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user?.email}`);
    });
  });
  
  return io;
}; 