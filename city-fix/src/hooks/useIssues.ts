import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { Issue, PaginatedResponse, IssueComment } from '../types/api';
import { STATUS_IDS } from '../utils/helpers';

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

export const useIssuesFeed = (perPage = 15, filters?: {
  search?: string;
  user_id?: number;
  status_id?: number;
  category_id?: number;
}) => {
  return useQuery({
    queryKey: ['issues', 'feed', perPage, filters],
    queryFn: async () => {
      const params: any = { per_page: perPage };
      if (filters?.search) params.search = filters.search;
      if (filters?.user_id) params.user_id = filters.user_id;
      if (filters?.status_id) params.status_id = filters.status_id;
      if (filters?.category_id) params.category_id = filters.category_id;

      const response = await apiClient.get<PaginatedResponse<Issue>>('/issues/feed', { params });
      return response.data;
    },
  });
};

/**
 * Hook to get global counts for the dashboard cards.
 * It fetches a large sample to calculate totals accurately.
 */
export const useGlobalStats = () => {
  return useQuery({
    queryKey: ['issues', 'global-stats'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Issue>>('/issues/feed?per_page=100');
      const all = (response.data.data || []).filter(r => !r.is_hidden);
      return {
        reported: all.filter(r => Number(r.status_id) === STATUS_IDS.PENDIENTE).length,
        inProgress: all.filter(r => Number(r.status_id) === STATUS_IDS.EN_PROCESO).length,
        resolved: all.filter(r => Number(r.status_id) === STATUS_IDS.RESUELTO).length,
        total: all.length
      };
    },
    // Refresh stats every minute or when a new issue is created
    staleTime: 60000,
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
    queryKey: ['issues', 'details', id ? String(id) : null, userId],
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

      return issue;
    },
    enabled: !!id,
  });
};

export const useIssueComments = (id: number | string | null) => {
  return useQuery({
    queryKey: ['issues', 'comments', id ? String(id) : null],
    queryFn: async () => {
      if (!id) return [];
      const response = await apiClient.get<IssueComment[]>(`/issues/${id}/comments`);
      return response.data;
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
      // Invalida todos los detalles de issues, comentarios y el feed para forzar refresco
      queryClient.invalidateQueries({ queryKey: ['issues', 'details'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useWorkers = () => {
  return useQuery({
    queryKey: ['users', 'workers'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users');
      let allUsers = [];
      
      if (Array.isArray(response.data)) {
        allUsers = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        allUsers = response.data.data;
      } else if (response.data && Array.isArray(response.data.users)) {
        allUsers = response.data.users;
      }

      console.log(`[DEBUG] useWorkers - Found ${allUsers.length} total users in admin`);
      
      const workers = allUsers.filter((u: any) => {
        const roleId = Number(u.role_id);
        const roleName = (u.role?.name || '').toLowerCase();
        
        // Log para ver qué roles estamos recibiendo
        
        return roleId === 2 || roleName.includes('work') || roleName.includes('trabaj');
      });

      console.log(`[DEBUG] useWorkers - Found ${workers.length} workers`);
      return workers;
    },
  });
};

// ─── Admin Hooks ────────────────────────────────────────

export interface AdminIssuesFilters {
  is_hidden?: boolean;
  status_id?: number;
  category_id?: number;
  search?: string;
  per_page?: number;
}

/**
 * Fetch ALL issues (including hidden) for admin panel.
 * GET /api/admin/issues
 */
export const useAdminIssues = (filters?: AdminIssuesFilters) => {
  return useQuery({
    queryKey: ['admin', 'issues', filters],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (filters?.is_hidden !== undefined) params.is_hidden = filters.is_hidden ? 1 : 0;
      if (filters?.status_id) params.status_id = filters.status_id;
      if (filters?.category_id) params.category_id = filters.category_id;
      if (filters?.search) params.search = filters.search;
      params.per_page = filters?.per_page || 50;

      // Importante: Usar /admin/issues para poder ver los reportes ocultos
      const response = await apiClient.get<PaginatedResponse<Issue>>('/admin/issues', { params });
      return response.data;
    },
  });
};

export interface AdminUpdateIssuePayload {
  title?: string;
  description?: string;
  category_id?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  status_id?: number;
}

/**
 * Edit any issue as admin.
 * PUT /api/admin/issues/{id}
 */
export const useAdminUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, payload }: { issueId: number; payload: AdminUpdateIssuePayload }) => {
      const response = await apiClient.put(`/admin/issues/${issueId}`, payload);
      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'history', idStr] });
    },
  });
};

/**
 * Toggle issue visibility (hide/show from public feed).
 * PATCH /api/admin/issues/{id}/toggle-hidden
 */
export const useToggleIssueHidden = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, reason }: { issueId: number; reason?: string }) => {
      const response = await apiClient.patch(`/admin/issues/${issueId}/toggle-hidden`, {
        reason,
      });
      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'global-stats'] }); // Actualizar contadores del dashboard
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
    },
  });
};

