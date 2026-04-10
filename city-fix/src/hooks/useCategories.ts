import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { Category } from '../types/api';

export interface CreateCategoryPayload {
  name: string;
  icon: string;
  parent_id?: number | null;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // The requirement mentioned POST /api/categories, but typically we need GET too.
      // Assuming GET /api/categories exists to fetch them.
      const response = await apiClient.get<Category[]>('/categories');
      return response.data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const response = await apiClient.post<Category>('/categories', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
