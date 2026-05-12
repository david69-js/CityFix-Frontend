import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get<Notification[]>('/notifications');
      return response.data;
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUnreadCount = () => {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.is_read).length || 0;
};

export const useRegisterFCMToken = () => {
  return useMutation({
    mutationFn: async (fcm_token: string) => {
      const response = await apiClient.post('/users/fcm-token', { fcm_token });
      return response.data;
    },
  });
};

export interface CampaignPayload {
  title: string;
  message: string;
}

export const useSendCampaign = () => {
  return useMutation({
    mutationFn: async (payload: CampaignPayload) => {
      const response = await apiClient.post('/admin/notifications/campaign', payload);
      return response.data;
    },
  });
};
