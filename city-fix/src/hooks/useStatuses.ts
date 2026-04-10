import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { IssueStatus } from '../types/api';

export interface CreateStatusPayload {
  name: string;
  color: string;
  sort_order: number;
}

export const useCreateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStatusPayload) => {
      const response = await apiClient.post<IssueStatus>('/issue-statuses', payload);
      return response.data;
    },
    onSuccess: () => {
      // Typically statuses are static, but if we have a list hook, we'd invalidate it.
      queryClient.invalidateQueries({ queryKey: ['issue-statuses'] });
    },
  });
};
