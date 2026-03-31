import { create } from 'zustand';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import apiClient from '../api/axios';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role_id?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  
  // Actions
  setToken: (token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  token: null,
  user: null,
  isLoading: true,

  setToken: async (token: string) => {
    set({ token }); // Update global state immediately to prevent layout bouncing
    await setItemAsync('userToken', token);
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    await deleteItemAsync('userToken');
    set({ token: null, user: null });
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getItemAsync('userToken');
      if (token) {
        set({ token });
        try {
          const response = await apiClient.get('/auth/me');
          if (response.data) {
            set({ user: response.data });
          }
        } catch (error) {
          console.warn('Failed to fetch user profile automatically:', error);
          // If the token is invalid or expired, we might want to log out
          // but for now we just log a warning.
        }
      }
    } catch (e) {
      // Failed to restore token
    } finally {
      set({ isLoading: false });
    }
  },
}));
