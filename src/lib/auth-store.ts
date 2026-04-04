import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, NexFlowXAPIError } from './api/client';
import type { AuthUser, UserRole } from './api/contracts';

interface AuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  loginError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Called on app mount — validates JWT and refreshes user info */
  validateToken: () => Promise<void>;
}

/**
 * Role guard helpers — use in components to conditionally render UI.
 * These are computed from the persisted store state.
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function isMerchant(user: AuthUser | null): boolean {
  return user?.role === 'merchant';
}

export function getUserRole(user: AuthUser | null): UserRole {
  return user?.role ?? 'merchant';
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      loginError: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, loginError: null });
        try {
          const res = await api.auth.login({ username, password });
          set({
            isAuthenticated: true,
            user: res.user,
            loginError: null,
            isLoading: false,
          });
          return true;
        } catch (err) {
          let message = 'Erro de conexão com o servidor.';
          if (err instanceof NexFlowXAPIError) {
            if (err.status === 401) {
              message = 'Credenciais inválidas. Acesso não autorizado.';
            } else {
              message = err.message;
            }
          }
          set({ loginError: message, isLoading: false, isAuthenticated: false, user: null });
          return false;
        }
      },

      logout: async () => {
        try {
          await api.auth.logout();
        } catch {
          // Ignore logout API errors — clear local state regardless
        } finally {
          set({
            isAuthenticated: false,
            user: null,
            loginError: null,
            isLoading: false,
          });
        }
      },

      validateToken: async () => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('nexflowx_token')
          : null;

        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const res = await api.auth.me();
          set({
            isAuthenticated: true,
            user: res.user,
            isLoading: false,
          });
        } catch {
          // Token is invalid or expired — clear it
          localStorage.removeItem('nexflowx_token');
          localStorage.removeItem('nexflowx_refresh');
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'nexflowx-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
