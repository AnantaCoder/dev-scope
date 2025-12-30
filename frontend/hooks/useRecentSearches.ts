"use client";

import { useState, useEffect, useCallback } from 'react';

interface RecentUser {
  login: string;
  avatar_url: string;
  name?: string;
  searchedAt: string;
}

interface ComparedPair {
  users: { login: string; avatar_url: string; name?: string }[];
  comparedAt: string;
}

const RECENT_USERS_KEY = 'devscope_recent_users';
const COMPARED_USERS_KEY = 'devscope_compared_users';
const MAX_RECENT = 10;

/**
 * Custom hook for managing recently searched and compared users in session storage.
 * Data persists for the browser session (cleared when tab closes).
 */
export function useRecentSearches() {
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [comparedPairs, setComparedPairs] = useState<ComparedPair[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const storedUsers = sessionStorage.getItem(RECENT_USERS_KEY);
      const storedCompared = sessionStorage.getItem(COMPARED_USERS_KEY);
      
      if (storedUsers) setRecentUsers(JSON.parse(storedUsers));
      if (storedCompared) setComparedPairs(JSON.parse(storedCompared));
    } catch (err) {
      console.error('Failed to load recent searches from session storage:', err);
    }
    setIsLoaded(true);
  }, []);

  // Add a recently searched user
  const addRecentUser = useCallback((user: { login: string; avatar_url: string; name?: string }) => {
    setRecentUsers(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(u => u.login.toLowerCase() !== user.login.toLowerCase());
      const updated = [
        { 
          login: user.login, 
          avatar_url: user.avatar_url, 
          name: user.name,
          searchedAt: new Date().toISOString() 
        },
        ...filtered
      ].slice(0, MAX_RECENT);
      
      try {
        sessionStorage.setItem(RECENT_USERS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to session storage:', err);
      }
      return updated;
    });
  }, []);

  // Add a compared pair
  const addComparedPair = useCallback((users: { login: string; avatar_url: string; name?: string }[]) => {
    if (users.length < 2) return;
    
    setComparedPairs(prev => {
      // Check if this exact comparison already exists
      const exists = prev.some(pair => 
        pair.users.length === users.length &&
        pair.users.every(u => users.some(nu => nu.login.toLowerCase() === u.login.toLowerCase()))
      );
      
      if (exists) return prev;
      
      const updated = [
        { 
          users: users.map(u => ({ login: u.login, avatar_url: u.avatar_url, name: u.name })), 
          comparedAt: new Date().toISOString() 
        },
        ...prev
      ].slice(0, MAX_RECENT);
      
      try {
        sessionStorage.setItem(COMPARED_USERS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to session storage:', err);
      }
      return updated;
    });
  }, []);

  // Remove a specific user from recent
  const removeRecentUser = useCallback((login: string) => {
    setRecentUsers(prev => {
      const updated = prev.filter(u => u.login.toLowerCase() !== login.toLowerCase());
      try {
        sessionStorage.setItem(RECENT_USERS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to session storage:', err);
      }
      return updated;
    });
  }, []);

  // Clear all recent data
  const clearRecent = useCallback(() => {
    try {
      sessionStorage.removeItem(RECENT_USERS_KEY);
      sessionStorage.removeItem(COMPARED_USERS_KEY);
    } catch (err) {
      console.error('Failed to clear session storage:', err);
    }
    setRecentUsers([]);
    setComparedPairs([]);
  }, []);

  return {
    recentUsers,
    comparedPairs,
    isLoaded,
    addRecentUser,
    addComparedPair,
    removeRecentUser,
    clearRecent
  };
}

export default useRecentSearches;
