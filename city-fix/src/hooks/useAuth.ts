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
  invitation_code?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password?: string;
  password_confirmation?: string;
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
          // El backend devuelve { user: { ... } }
          if (userResp.data?.user) {
            data.user = userResp.data.user;
          } else if (userResp.data) {
            data.user = userResp.data;
          }
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
      console.log('[useLogin] Login Success. Data Keys:', Object.keys(data));
      if (data.user) {
        console.log('[useLogin] Setting User...');
        setUser(data.user);
      }
      const activeToken = data.token || data.access_token || (data.data && (data.data.token || data.data.access_token));
      console.log('[useLogin] Active Token Found:', !!activeToken);
      if (activeToken) {
        console.log('[useLogin] Calling setToken...');
        setToken(activeToken);
      } else {
        console.warn('[useLogin] CRITICAL: No token found in any expected field!');
        console.log('[useLogin] Full data:', JSON.stringify(data));
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

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      const response = await apiClient.post('/auth/forgot-password', payload);
      return response.data;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      const response = await apiClient.post('/auth/reset-password', payload);
      return response.data;
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

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;
  avatar?: {
    uri: string;
    name: string;
    type: string;
  } | null;
}

export const useUpdateProfile = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, payload }: { userId: number; payload: UpdateProfilePayload }) => {
      const formData = new FormData();
      
      if (payload.first_name) formData.append('first_name', payload.first_name);
      if (payload.last_name) formData.append('last_name', payload.last_name);
      if (payload.phone) formData.append('phone', payload.phone);
      if (payload.password) formData.append('password', payload.password);

      if (payload.avatar) {
        formData.append('avatar', {
          uri: payload.avatar.uri,
          type: payload.avatar.type,
          name: payload.avatar.name,
        } as any);
      }

      // Using POST with _method=PUT is the standard Laravel way to handle files in updates
      const response = await apiClient.post(`/users/${userId}?_method=PUT`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onSuccess: (data: any, variables) => {
      // If we updated ourselves, refresh the local user state
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.id === variables.userId) {
        // Handle different response formats
        const updatedUser = data.user || data;
        setUser(updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
