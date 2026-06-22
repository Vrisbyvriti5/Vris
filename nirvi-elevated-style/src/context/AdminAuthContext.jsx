import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, getToken, setToken, removeToken } from '@/lib/api';

const STORAGE_KEY = 'vris-admin-auth-v1';
const AdminAuthContext = createContext(undefined);

const loadAdminSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(loadAdminSession);

  useEffect(() => {
    if (!admin) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
  }, [admin]);

  const login = async ({ email, password }) => {
    try {
      const res = await authAPI.login(email, password);
      const { user, token } = res.data;

      // Only allow admin role
      if (user.role !== 'admin') {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      setToken(token);

      const session = {
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      };

      setAdmin(session);

      return {
        success: true,
        admin: session,
      };
    } catch (err) {
      const message = err.status === 401
        ? 'Invalid email or password'
        : err.status === 0
          ? 'Unable to reach server. Please check your internet or backend connection.'
          : err.data?.message || err.message || 'Invalid email or password.';
      return {
        success: false,
        message,
      };
    }
  };

  const logout = () => {
    setAdmin(null);
    removeToken();
  };

  const value = {
    admin,
    isAuthenticated: Boolean(admin),
    login,
    logout,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }

  return context;
};
