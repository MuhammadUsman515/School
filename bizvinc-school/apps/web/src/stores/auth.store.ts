'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  tenantId: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  logoUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, tenant, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, tenant, accessToken, refreshToken });
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, tenant: null, accessToken: null, refreshToken: null });
      },
      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    { name: 'bizvinc-auth' },
  ),
);
