import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (data: { email?: string; fullName?: string; credential?: string }) => Promise<{ success: boolean; message?: string }>;
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserOnboarding: (status: boolean) => void;
  updateUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        api.setToken(null);
        setUser(null);
      }
    } catch (e) {
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.setOnUnauthorized(() => {
      setUser(null);
    });
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string, rememberMe = false) => {
    const res = await api.login({ email, password, rememberMe });
    if (res.success && res.data?.token) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const loginWithGoogle = async (data: { email?: string; fullName?: string; credential?: string }) => {
    const res = await api.googleAuth(data);
    if (res.success && res.data?.token) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Google authentication failed' };
  };

  const register = async (fullName: string, email: string, password: string, confirmPassword: string) => {
    const res = await api.register({ fullName, email, password, confirmPassword });
    if (res.success && res.data?.token) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      api.setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateUserOnboarding = (status: boolean) => {
    setUser(prev => prev ? { ...prev, onboardingCompleted: status } : null);
  };

  const updateUserName = (name: string) => {
    setUser(prev => prev ? { ...prev, fullName: name } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        updateUserOnboarding,
        updateUserName,
      }}
    >
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
