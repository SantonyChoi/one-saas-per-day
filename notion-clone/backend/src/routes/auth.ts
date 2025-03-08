import express from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login', login);

// Logout a user
router.post('/logout', logout);

// Get the current user
router.get('/me', authenticateToken, getCurrentUser);

export default router; 