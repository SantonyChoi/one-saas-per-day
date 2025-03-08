import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../models/user.js';

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name?: string;
      };
    }
  }
}

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Middleware to authenticate JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the cookies or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    // Get the user from the database
    const user = getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Attach the user to the request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Generate a JWT token for a user
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Optional authentication middleware
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Get the token from the cookies or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next();
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    // Get the user from the database
    const user = getUserById(decoded.id);
    
    if (user) {
      // Attach the user to the request object
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      };
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without setting user
    next();
  }
}; 