import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Mock authentication - replace with real API call
        if (email === 'demo@example.com' && password === 'password') {
          const mockUser: User = {
            id: '1',
            email,
            fullName: 'Utilisateur Demo'
          };
          const mockToken = 'mock-jwt-token';
          
          set({
            user: mockUser,
            accessToken: mockToken,
            isAuthenticated: true
          });
        } else {
          throw new Error('Identifiants invalides');
        }
      },
      
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false
        });
      },
      
      setUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);