'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, UserRole } from '../types/auth';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: AuthUser | null;
  currentUser: AuthUser | null; // Compatibility alias
  isAuthenticated: boolean;
  role: UserRole;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserLocation: (latitude: number, longitude: number, locationName: string) => Promise<void>;
  // Legacy Firebase sign-in compatibility aliases so existing components don't break
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const storedToken = apiClient.getAuthToken();
      if (!storedToken) {
        setUser(null);
        setRole('user');
        setToken(null);
        setLoading(false);
        return;
      }

      const res = await apiClient.get<{ user: AuthUser }>('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setRole(res.data.user.role || 'user');
        setToken(storedToken);
      } else {
        // Token invalid or expired
        apiClient.setAuthToken(null);
        setUser(null);
        setRole('user');
        setToken(null);
      }
    } catch {
      apiClient.setAuthToken(null);
      setUser(null);
      setRole('user');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, pass: string) => {
    setError(null);
    const res = await apiClient.post<{
      access_token: string;
      token_type: string;
      user: AuthUser;
      error?: string;
    }>('/auth/login', {
      email,
      password: pass,
    });

    if (res.success && res.data?.access_token) {
      const { access_token, user: loggedInUser } = res.data;
      apiClient.setAuthToken(access_token);
      setToken(access_token);
      setUser(loggedInUser);
      setRole(loggedInUser.role || 'user');
      return;
    }

    const errMsg =
      typeof res.error === 'string'
        ? res.error
        : (res.error as any)?.message || (res.data as any)?.error || 'Invalid email or password.';
    setError(errMsg);
    throw new Error(errMsg);
  };

  const register = async (name: string, email: string, pass: string) => {
    setError(null);
    const res = await apiClient.post<{ message?: string; error?: string }>('/auth/register', {
      name,
      email,
      password: pass,
      confirmPassword: pass,
    });

    if (!res.success) {
      const errMsg =
        typeof res.error === 'string'
          ? res.error
          : (res.error as any)?.message || (res.data as any)?.error || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore network error on logout
    } finally {
      apiClient.setAuthToken(null);
      setUser(null);
      setRole('user');
      setToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const updateUserLocation = async (latitude: number, longitude: number, locationName: string) => {
    try {
      const res = await apiClient.post<{ user: AuthUser }>('/location/save', {
        latitude,
        longitude,
        location_name: locationName,
      });
      if (res.success && res.data?.user) {
        setUser((prev) => (prev ? { ...prev, ...res.data!.user } : res.data!.user));
      }
    } catch {
      // Non-fatal
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        isAuthenticated: !!user,
        role,
        token,
        loading,
        error,
        login,
        register,
        logout,
        refreshProfile: fetchProfile,
        updateUserLocation,
        signInWithEmail: login,
        signUpWithEmail: (email, pass, displayName) => register(displayName || 'User', email, pass),
        signInWithGoogle: async () => {
          throw new Error('Google Sign-In requires OAuth provider credentials in production.');
        },
        isConfigured: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
