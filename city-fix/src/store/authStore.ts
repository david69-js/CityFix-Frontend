import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  name: string;
  email: string;
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
    await SecureStore.setItemAsync('userToken', token);
    set({ token });
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    set({ token: null, user: null });
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await SecureStore.getItemAsync('userToken');
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
