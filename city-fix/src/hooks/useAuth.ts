import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { useAuthStore } from '../store/authStore';

// ======= TYPES =======
export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role_id?: number;
}

interface AuthResponse {
  token?: string;
  access_token?: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role_id?: number;
  };
}

// ======= HOOKS =======

export const useLogin = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  
  return useMutation({
    mutationFn: async (credentials: LoginPayload) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data: any) => {
      // Save token in Zustand + SecureStore
      const activeToken = data.token || data.access_token;
      if (activeToken) {
        setToken(activeToken);
      }
      if (data.user) {
        setUser(data.user);
      }
    },
  });
};

export const useRegister = () => {
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (userData: RegisterPayload) => {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      return response.data;
    },
    onSuccess: (data: any) => {
      const activeToken = data.token || data.access_token;
      if (activeToken) {
        setToken(activeToken);
      }
      if (data.user) {
        setUser(data.user);
      }
    },
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
  });
};
