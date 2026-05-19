import { create } from 'zustand';
import { Platform } from 'react-native';
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
  is_active?: boolean | number;
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

// Try to recover token immediately from memory storage (if already loaded)
// This prevents flashes of unauthenticated state during hot reloads
const initialToken = Platform.OS === 'web' 
  ? (typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : null)
  : null; // On native, we must wait for initializeAuth (SecureStore is async)

export const useAuthStore = create<AuthState>((set: any) => ({
  token: initialToken,
  user: null,
  isLoading: true,

  setToken: async (token: string | null) => {
    if (!token) {
      console.log('🚨 [AuthStore] TOKEN BEING SET TO NULL! Trace:', new Error().stack);
    }
    console.log('[AuthStore] Updating token in state:', token ? (token.substring(0, 10) + '...') : 'NULL');
    set({ token });
    setAuthToken(token);
    if (token) {
      await setItemAsync('userToken', token);
    } else {
      await deleteItemAsync('userToken');
    }
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
      console.log('[AuthStore] Initializing auth state...');
      set({ isLoading: true });
      const token = await getItemAsync('userToken');
      console.log('[AuthStore] Token from storage:', token ? 'Exists' : 'Null');
      if (token) {
        set({ token });
        setAuthToken(token);
        try {
          const response = await apiClient.get('/auth/me');
          const fetchedUser = response.data?.user || response.data;
          
          if (fetchedUser && (fetchedUser.is_active === false || Number(fetchedUser.is_active) === 0)) {
            console.warn('[AuthStore] Active session user is disabled, logging out');
            setAuthToken(null);
            await deleteItemAsync('userToken');
            set({ token: null, user: null });
            try {
              const { Alert } = require('react-native');
              Alert.alert(
                'Acceso denegado',
                'Tu cuenta ha sido deshabilitada por el administrador.'
              );
            } catch (alertError) {}
          } else {
            set({ user: fetchedUser });
          }
        } catch (error) {
          console.warn('[AuthStore] Token inválido o expirado, limpiando sesión:', error);
          setAuthToken(null);
          await deleteItemAsync('userToken');
          set({ token: null, user: null });
        }
      }
    } catch (e) {
      // Failed to restore token
    } finally {
      set({ isLoading: false });
    }
  },
}));
