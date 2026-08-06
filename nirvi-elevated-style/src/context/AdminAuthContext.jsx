import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { authAPI, getToken, setToken, removeToken } from '@/lib/api';

const STORAGE_KEY = 'vris-admin-auth-v1';
// Refresh the token every 6 hours (well before the 7-day expiry)
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const AdminAuthContext = createContext(undefined);

const loadAdminSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    return null;
  }
};

/**
 * Decode JWT payload without a library – just base64-decode the middle segment.
 * Returns null if the token is malformed.
 */
const decodeTokenPayload = (token) => {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
};

/**
 * Returns true if the token is expired or will expire within the given buffer (ms).
 */
const isTokenExpiredOrExpiring = (token, bufferMs = 60 * 1000) => {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - bufferMs;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(loadAdminSession);
  const refreshTimerRef = useRef(null);

  // Persist / clear localStorage when admin state changes
  useEffect(() => {
    try {
      if (!admin) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    } catch (err) {
      // Ignore
    }
  }, [admin]);

  const logout = useCallback(() => {
    setAdmin(null);
    removeToken();
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Silently refresh the token
  const refreshTokenSilently = useCallback(async () => {
    try {
      const currentToken = getToken();
      if (!currentToken) {
        logout();
        return;
      }

      const res = await authAPI.refreshToken();
      const newToken = res?.data?.token;
      if (newToken) {
        setToken(newToken);
        setAdmin((prev) => (prev ? { ...prev, token: newToken } : prev));
      }
    } catch (err) {
      // If refresh fails with 401, the token is fully expired – force logout
      if (err?.status === 401) {
        logout();
      }
      // For other errors (network etc.), silently ignore – will retry next interval
    }
  }, [logout]);

  // On mount: validate the stored token, kick out if expired, start refresh timer
  useEffect(() => {
    const session = loadAdminSession();
    const storedToken = session?.token || getToken();

    if (!session || !storedToken) {
      // No session stored, nothing to do
      return;
    }

    // If token is already expired, log out immediately
    if (isTokenExpiredOrExpiring(storedToken, 0)) {
      logout();
      return;
    }

    // If token will expire soon (within 1 hour), refresh immediately
    if (isTokenExpiredOrExpiring(storedToken, 60 * 60 * 1000)) {
      refreshTokenSilently();
    }

    // Set up periodic refresh
    refreshTimerRef.current = setInterval(refreshTokenSilently, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Start refresh timer on new login
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = setInterval(refreshTokenSilently, REFRESH_INTERVAL_MS);

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
