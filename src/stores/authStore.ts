import { create } from 'zustand';
import apiClient from '@/services/apiClient';
import { API_BASE_URL } from '@/config/api';
import type { User, SubscriptionStatus } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  subscription: SubscriptionStatus | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  setAuth: (token: string, user: User) => void;
  fetchUser: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  subscription: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,

  setAuth: (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.is_admin,
      loading: false,
    });
  },

  fetchUser: async () => {
    try {
      const { data } = await apiClient.get('/api/auth/me');
      const user = data.data || data;
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isAdmin: user.is_admin, loading: false });
    } catch (error: unknown) {
      // Only clear auth on 401 (unauthorized), not on network errors
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 401) {
        get().clearAuth();
      }
      // On network errors, keep the cached auth state
    }
  },

  fetchSubscription: async () => {
    try {
      const { data } = await apiClient.get('/api/subscription/status');
      set({ subscription: data.data || data });
    } catch {
      // ignore
    }
  },

  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // ignore
    }
    get().clearAuth();
    window.location.href = '/login';
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({
      user: null,
      token: null,
      subscription: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
    });
  },

  initialize: () => {
    // Bypass auth for local development
    if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
      const devUser: User = {
        id: 1,
        name: 'Dev User',
        email: 'dev@localhost',
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set({
        token: 'dev-bypass-token',
        user: devUser,
        isAuthenticated: true,
        isAdmin: true,
        loading: false,
        subscription: { tier: 'pro', is_active: true, videos_count: 0, videos_limit: 999, duration_limit: 9999 },
      });
      return;
    }

    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({
          token,
          user,
          isAuthenticated: true,
          isAdmin: user.is_admin,
          loading: false,
        });
        // Verify token is still valid
        get().fetchUser();
        get().fetchSubscription();
      } catch {
        get().clearAuth();
      }
    } else {
      set({ loading: false });
    }
  },
}));
