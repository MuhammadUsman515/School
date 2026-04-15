'use client';

import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, tenant, setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data.user, data.tenant, data.accessToken, data.refreshToken);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/login');
  };

  const register = async (payload: {
    schoolName: string;
    schoolSlug: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    country?: string;
  }) => {
    const { data } = await api.post('/auth/register', payload);
    setAuth(data.user, data.tenant, data.accessToken, data.refreshToken);
    return data;
  };

  return { user, tenant, login, logout, register, isAuthenticated: isAuthenticated() };
}
