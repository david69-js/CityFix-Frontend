import { create } from 'zustand';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import apiClient, { setAuthToken } from '../api/axios';

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
    if (!token) {
      console.warn('[AuthStore] setToken called with empty token');
      return;
    }
    console.log('[AuthStore] Updating token in state:', token.substring(0, 10) + '...');
    set({ token });
    setAuthToken(token);
    await setItemAsync('userToken', token);
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    setAuthToken(null);
    await deleteItemAsync('userToken');
    set({ token: null, user: null });
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getItemAsync('userToken');
      if (token) {
        set({ token });
        setAuthToken(token);
        try {
          const response = await apiClient.get('/auth/me');
          if (response.data?.user) {
            set({ user: response.data.user });
          } else if (response.data) {
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
