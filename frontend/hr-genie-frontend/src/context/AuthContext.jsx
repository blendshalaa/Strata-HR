import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authAPI, wakeUpBackend } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coldStarting, setColdStarting] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  // Skip fetchUser when login/register already provided user data
  const skipFetchRef = useRef(false);

  // Fire a wake-up ping to the backend on first mount (fire-and-forget)
  useEffect(() => {
    wakeUpBackend();
  }, []);

  useEffect(() => {
    if (token) {
      if (skipFetchRef.current) {
        // login() or register() already set the user — no need to re-fetch
        skipFetchRef.current = false;
        setLoading(false);
      } else {
        // Page refresh with token in localStorage — validate & fetch user
        fetchUser();
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    setLoading(true);
    setColdStarting(false);

    // If the fetch takes more than 5s, the backend is likely cold-starting
    const coldStartTimer = setTimeout(() => setColdStarting(true), 5000);

    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      clearTimeout(coldStartTimer);
      setColdStarting(false);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    skipFetchRef.current = true;
    setToken(token);
    setUser(user);
    
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    skipFetchRef.current = true;
    setToken(token);
    setUser(user);
    
    return response.data;
  };

  const logout = async () => {
    // Clear client state immediately so the UI responds instantly
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Then clear the httpOnly cookie on the server
    try { await authAPI.logout(); } catch (e) { /* ignore — local state already cleared */ }
  };

  /** Re-fetch the current user from /auth/me — call after avatar or profile changes */
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    coldStarting,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isHR: user?.role === 'hr' || user?.role === 'admin',
    orgSlug: user?.org_slug || null,
    orgName: user?.org_name || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};