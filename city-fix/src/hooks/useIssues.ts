import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { Issue, PaginatedResponse } from '../types/api';

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

export const useIssuesFeed = (perPage = 15) => {
  return useQuery({
    queryKey: ['issues', 'feed', perPage],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Issue>>(`/issues/feed?per_page=${perPage}`);
      return response.data;
    },
  });
};

export const useMyIssues = (userId: number | undefined) => {
  return useQuery({
    queryKey: ['issues', 'my-issues', userId],
    queryFn: async () => {
      if (!userId) return [];
      // As a workaround since there's no backend filter by user_id, 
      // we request a large feed and filter on the frontend.
      const response = await apiClient.get<PaginatedResponse<Issue>>(`/issues/feed?per_page=100`);
      return response.data.data.filter(issue => issue.user_id === userId || issue.user?.id === userId);
    },
    enabled: !!userId,
  });
};

export const useIssueDetails = (id: number | string | null, userId?: number) => {
  return useQuery({
    queryKey: ['issues', 'details', id ? String(id) : null],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<Issue>(`/issues/${id}`);
      const issue = response.data;

      // Workaround: Fetch upvotes to get count and check if current user voted
      try {
        const upvotesRes = await apiClient.get<any[]>('/upvotes');
        const upvotes = upvotesRes.data;
        const issueUpvotes = upvotes.filter((v: any) => v.issue_id === issue.id);
        
        issue.upvotes_count = issueUpvotes.length;
        issue.has_voted = userId ? issueUpvotes.some((v: any) => v.user_id === userId) : false;
      } catch (e) {
        console.log("Could not fetch upvotes workaround", e);
        if (issue.upvotes_count === undefined) issue.upvotes_count = 0;
        issue.has_voted = false;
      }

      // Workaround: Use the length of the comments array if comments_count is missing
      if (issue.comments_count === undefined || issue.comments_count === null) {
        issue.comments_count = issue.comments?.length || 0;
      }

      return issue;
    },
    enabled: !!id,
  });
};

export const useIssueHistory = (id: number | string | null) => {
  return useQuery({
    queryKey: ['issues', 'history', id ? String(id) : null],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<any>(`/issues/${id}/history-logs`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, comment }: { issueId: number; comment: string }) => {
      const response = await apiClient.post(`/issues/${issueId}/comments`, { 
        issue_id: issueId,
        comment 
      });
      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'history', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
    },
  });
};

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: number) => {
      const response = await apiClient.post(`/issues/${issueId}/toggle-upvote`);
      return response.data;
    },
    onSuccess: (_, issueId) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'history', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
    },
  });
};

export const useMyAssignments = () => {
  return useQuery({
    queryKey: ['assignments', 'my-assignments'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/my-assignments');
      return response.data;
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, statusId }: { issueId: number; statusId: number }) => {
      const response = await apiClient.patch(`/issues/${issueId}/status`, {
        status_id: statusId
      });
      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'history', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'my-assignments'] });
    },
  });
};

export const useAssignWorker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, workerId, notes }: { issueId: number; workerId: number; notes?: string }) => {
      // Create local timestamp string in YYYY-MM-DD HH:mm:ss format
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');

      const response = await apiClient.post('/assignments', {
        issue_id: issueId,
        worker_id: workerId,
        status_id: 1,
        notes: notes || '',
        assigned_at: localISOTime
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', variables.issueId] });
    }
  });
};

export const useWorkers = () => {
  return useQuery({
    queryKey: ['users', 'workers'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      const users = Array.isArray(response.data) ? response.data : (response.data.data || []);
      return users.filter((u: any) => u.role_id === 2);
    },
  });
};
