import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import collaboratorsRoutes from './routes/collaborators.js';

// Import socket.io initialization
import { initializeSocketIO } from './socket/index.js';

// Create Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Socket.IO
const io = initializeSocketIO(server);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'your_cookie_secret_key_change_in_production'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/collaborators', collaboratorsRoutes);

// Simple test route
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Backend server is running!' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Get the directory name
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Serve static files from the frontend build directory
  app.use(express.static(path.join(__dirname, '../../frontend/out')));
  
  // Handle all other routes by serving the index.html file
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../frontend/out/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 