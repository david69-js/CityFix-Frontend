import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  role_id: number;
  role?: {
    id: number;
    name: string;
  };
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users');
      // Laravel sometimes returns data in a 'data' field if paginated
      return Array.isArray(response.data) ? response.data : (response.data.data || []);
    },
  });
};

export const useToggleUserActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.patch(`/admin/users/${userId}/toggle-active`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useAdminUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, payload }: { userId: number; payload: any }) => {
      const response = await apiClient.put(`/admin/users/${userId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
