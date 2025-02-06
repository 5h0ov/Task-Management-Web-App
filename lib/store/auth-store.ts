// zustand store used primarily for authentication state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import { User } from '@/lib/types/schema';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isChecking: false,
      error: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),


      checkAuth: async () => {
        set({ isLoading: true, isChecking: true, error: null });

        try {
          const res = await fetch('/api/auth/checkAuth', {
            method: 'GET',
            credentials: 'include'
          });
          const data = await res.json();
      
          if (!data.user) {
            set({ user: null, token: null, isChecking: false });
            return;
          }
      
          set({ 
            isChecking: false,
            user: data.user, 
            token: data.token,
            error: null 
          });
        } catch (error: any) {
          set({ user: null, token: null, error: error.message , isChecking: false });
          console.error('Auth check failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.message || "Login failed");
          
          set({ user: data.user, token: data.token });
          toast.success("Login successful");
          return data;
        } catch (error: any) {
          set({ user: null, token: null, error: error.message });
          toast.error(error.message);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
            credentials: 'include'
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.message || "Registration failed");
          
          set({ user: data.user, token: data.token });
          toast.success("Registration successful");
          return data;

        } catch (error: any) {
          set({ user: null, token: null, error: error.message });
          toast.error(error.message);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
          });
          set({ user: null, token: null });
          toast.success('Logout successful');
        } catch (error: any) {
          toast.error('Logout failed, Error: ' + error.message);
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({   // store only user and token
        user: state.user,
        token: state.token 
      })
    }
  )
);