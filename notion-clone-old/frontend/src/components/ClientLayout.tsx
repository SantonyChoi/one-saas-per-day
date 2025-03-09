"use client";

import React from 'react';
import { AuthProvider } from '@/lib/auth-context';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default ClientLayout; 