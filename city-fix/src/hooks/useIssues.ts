import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

export interface CreateIssuePayload {
  category_id: number;
  title: string;
  description: string;
  location: string;
  latitude: string | number;
  longitude: string | number;
  image?: {
    uri: string;
    name: string;
    type: string;
  } | null;
}

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateIssuePayload) => {
      const formData = new FormData();
      
      formData.append('category_id', payload.category_id.toString());
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('location', payload.location);
      formData.append('latitude', payload.latitude.toString());
      formData.append('longitude', payload.longitude.toString());

      if (payload.image) {
        // En React Native, adjuntar un objeto con uri, type y name funciona como un Blob.
        formData.append('image', {
          uri: payload.image.uri,
          type: payload.image.type,
          name: payload.image.name,
        } as any);
      }

      const response = await apiClient.post('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
};
