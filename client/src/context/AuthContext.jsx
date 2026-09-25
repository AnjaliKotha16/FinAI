import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Helper to store authentication data
  const handleAuthSuccess = (authToken, userData) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  // Helper to clear authentication data
  const clearAuthData = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Check auth state on app startup
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getCurrentUser();
      if (res.ok && res.data.success) {
        setUser(res.data.user);
        setToken(storedToken);
      } else {
        // Token expired or invalid
        clearAuthData();
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.ok && res.data.success) {
      handleAuthSuccess(res.data.token, res.data.user);
      return { success: true, message: res.data.message };
    } else {
      const errorMsg = res.data?.message || res.error || 'Invalid email or password.';
      return { success: false, message: errorMsg };
    }
  };

  // Register function
  const register = async (name, email, password) => {
    const res = await authService.register(name, email, password);
    if (res.ok && res.data.success) {
      handleAuthSuccess(res.data.token, res.data.user);
      return { success: true, message: res.data.message };
    } else {
      const errorMsg = res.data?.message || res.error || 'Registration failed. Please try again.';
      return { success: false, message: errorMsg };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('[AuthContext] Error during logout API call:', error);
    } finally {
      clearAuthData();
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
