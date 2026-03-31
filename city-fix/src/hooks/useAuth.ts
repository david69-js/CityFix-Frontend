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
      const data = response.data;
      
      const activeToken = data.token || data.access_token;
      // If the backend didn't supply the full user object but gave us a token
      if (!data.user && activeToken) {
        // Temporarily assign token for the immediate next request
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
        try {
          const userResp = await apiClient.get('/auth/me');
          if (userResp.data) data.user = userResp.data;
        } catch(e) {
          console.warn("Failed fetching user immediately after login");
        } finally {
          // Cleanup default header, interceptor takes over
          delete apiClient.defaults.headers.common['Authorization'];
        }
      }
      return data;
    },
    onSuccess: (data: any) => {
      if (data.user) {
        setUser(data.user);
      }
      const activeToken = data.token || data.access_token;
      if (activeToken) {
        setToken(activeToken); // Set token LAST so the redirect happens AFTER user is set
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
      const data = response.data;
      
      const activeToken = data.token || data.access_token;
      if (!data.user && activeToken) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
        try {
          const userResp = await apiClient.get('/auth/me');
          if (userResp.data) data.user = userResp.data;
        } catch(e) {} finally {
          delete apiClient.defaults.headers.common['Authorization'];
        }
      }
      return data;
    },
    onSuccess: (data: any) => {
      if (data.user) {
        setUser(data.user);
      }
      const activeToken = data.token || data.access_token;
      if (activeToken) {
        setToken(activeToken);
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
