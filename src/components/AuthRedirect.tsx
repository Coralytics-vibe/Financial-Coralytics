"use client";

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AuthRedirectProps {
  isAuthenticated: boolean; // true for protected routes, false for public routes (like login)
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ isAuthenticated }) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Optionally render a loading spinner or placeholder
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        Carregando autenticação...
      </div>
    );
  }

  if (isAuthenticated) {
    // If route requires authentication
    return session ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
  } else {
    // If route should NOT have authentication (e.g., login page)
    return session ? <Navigate to="/dashboard" replace /> : <Outlet />;
  }
};

export default AuthRedirect;