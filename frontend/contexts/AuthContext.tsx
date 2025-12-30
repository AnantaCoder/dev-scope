"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  company?: string;
  followers: number;
  following: number;
  public_repos: number;
  has_private_access: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  loginBasic: () => void;
  loginFull: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, _setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();

    // Listen for session expiration events
    const handleSessionExpired = () => {
      console.log('Session expired, logging out...');
      setUser(null);
      // Redirect to home page with message
      window.location.href = '/?session=expired';
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await api.getCurrentUser();
      if (!response.error && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to chooser page so user picks Quick vs Full
    window.location.href = `/choose-signin?pref=full`;
  };

  const loginBasic = () => {
    // Redirect to chooser with basic pref selected
    window.location.href = `/choose-signin?pref=basic`;
  };

  const loginFull = () => {
    // Redirect to chooser with full pref selected
    window.location.href = `/choose-signin?pref=full`;
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginBasic,
        loginFull,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
