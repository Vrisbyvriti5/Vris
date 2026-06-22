import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, getToken, setToken, removeToken } from '@/lib/api';

const AuthContext = createContext(undefined);
const AUTH_STORAGE_KEY = 'vris-user';

const readStoredUser = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

const persistUser = (nextUser) => {
  if (!nextUser) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // On mount, verify token is still valid
  useEffect(() => {
    const token = getToken();
    if (token) {
      authAPI.getProfile()
        .then((res) => {
          const freshUser = { ...res.data, token };
          setUser(freshUser);
          persistUser(freshUser);
        })
        .catch(() => {
          // token expired or invalid
          setUser(null);
          persistUser(null);
          removeToken();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithToken = async (token) => {
    if (!token) {
      return { success: false, message: 'Missing token.' };
    }

    setLoading(true);
    setError('');
    try {
      setToken(token);
      const res = await authAPI.getProfile();
      const nextUser = { ...res.data, token };
      setUser(nextUser);
      persistUser(nextUser);
      return { success: true, user: nextUser };
    } catch (err) {
      removeToken();
      persistUser(null);
      setUser(null);
      const msg = err.data?.message || err.message || 'OAuth login failed.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login(email, password);
      const { user: userData, token } = res.data;
      setToken(token);
      const nextUser = { ...userData, token };
      setUser(nextUser);
      persistUser(nextUser);
      return { success: true, user: nextUser };
    } catch (err) {
      const msg = err.status === 401
        ? 'Invalid email or password'
        : err.status === 0
          ? 'Unable to reach server. Please check your internet or backend connection.'
          : err.data?.message || err.message || 'Login failed.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, phone = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register(name, email, password, phone);
      const { user: userData, token } = res.data;
      setToken(token);
      const nextUser = { ...userData, token };
      setUser(nextUser);
      persistUser(nextUser);
      return { success: true, user: nextUser };
    } catch (err) {
      const msg = err.data?.message || err.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout().catch(() => {
      // Keep local logout working even if backend is unavailable.
    });
    setUser(null);
    persistUser(null);
    removeToken();
  };

  const updateProfile = async (payload = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.updateProfile(payload);
      const updatedUser = { ...(res.data || {}), token: user?.token || getToken() };
      setUser(updatedUser);
      persistUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to update profile.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      const refreshedUser = { ...(res.data || {}), token: user?.token || getToken() };
      setUser(refreshedUser);
      persistUser(refreshedUser);
      return { success: true, user: refreshedUser };
    } catch (err) {
      return { success: false, message: err.data?.message || err.message || 'Failed to refresh profile.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, signup, logout, updateProfile, refreshProfile, isAuthenticated: !!user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
