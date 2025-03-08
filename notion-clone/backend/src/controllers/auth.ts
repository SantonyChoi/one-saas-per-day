import { Request, Response } from 'express';
import { createUser, getUserByEmail, verifyPassword } from '../models/user.js';
import { generateToken } from '../middleware/auth.js';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Create the user
    const userId = await createUser({ email, password, name });
    
    // Generate a token
    const token = generateToken(userId);
    
    // Set the token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Return success
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        name: name || undefined
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'An error occurred during registration' });
  }
};

// Login a user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user exists
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate a token
    const token = generateToken(user.id);
    
    // Set the token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Return success
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
};

// Logout a user
export const logout = (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie('token');
  
  // Return success
  return res.status(200).json({ message: 'Logout successful' });
};

// Get the current user
export const getCurrentUser = (req: Request, res: Response) => {
  // If we got here, the user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Return the user
  return res.status(200).json({
    user: req.user
  });
}; 