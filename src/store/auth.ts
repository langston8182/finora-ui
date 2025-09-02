import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';
import { AuthState, User } from '../types';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setAuthData: (user: User, accessToken: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Mock authentication - replace with real API call
        if (email === 'demo@example.com' && password === 'password' || 
            email === 'cognito-user@example.com' && password === 'cognito-authenticated') {
          const mockUser: User = {
            id: '1',
            email,
            fullName: email === 'cognito-user@example.com' ? 'Utilisateur Cognito' : 'Utilisateur Demo'
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
        // Call API to clear server-side cookies and redirect
        authApi.signout()
          .then(() => {
            // Clear local state after successful API call
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false
            });
          })
          .catch(error => {
            console.error('Error during signout:', error);
            // Clear local state even if API call fails
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false
            });
          });
      },
      
      setUser: (user: User) => {
        set({ 
          user,
          isAuthenticated: true
        });
      },
      
      setAuthData: (user: User, accessToken: string) => {
        set({
          user,
          accessToken,
          isAuthenticated: true
        });
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