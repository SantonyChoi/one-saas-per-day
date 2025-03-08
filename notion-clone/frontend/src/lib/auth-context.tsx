import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authAPI } from './api';
import { initializeSocket, disconnectSocket } from './socket';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getCurrentUser();
        
        if (response.user) {
          setUser(response.user);
          // Initialize socket connection
          initializeSocket(response.token || '');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      if (response.user) {
        setUser(response.user);
        // Initialize socket connection
        initializeSocket(response.token || '');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(email, password, name);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      if (response.user) {
        setUser(response.user);
        // Initialize socket connection
        initializeSocket(response.token || '');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Register error:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await authAPI.logout();
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Disconnect socket
      disconnectSocket();
      
      // Clear user state
      setUser(null);
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      setError('An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 