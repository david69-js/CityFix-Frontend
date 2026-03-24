import { create } from 'zustand';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';

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
    await setItemAsync('userToken', token);
    set({ token });
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
        // NOTE: Here you would normally fetch the user profile using the token
        // e.g. using apiClient.get('/user') or something similar and call setUser.
      }
    } catch (e) {
      // Failed to restore token
    } finally {
      set({ isLoading: false });
    }
  },
}));
