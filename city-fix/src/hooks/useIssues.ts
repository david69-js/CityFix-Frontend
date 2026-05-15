import { Platform } from 'react-native';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { Issue, CreateIssuePayload, PaginatedResponse, IssueComment, UpdateIssuePayload, AdminUpdateIssuePayload } from '../types/api';
import { STATUS_IDS } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { getItemAsync, setItemAsync } from '../utils/storage';

// --- Local Vote Cache Strategy ---
// Since the backend sometimes drops the 'has_voted' state, we maintain a local record
const getLocalVotes = async (): Promise<Record<string, boolean>> => {
  try {
    const data = await getItemAsync('local_votes');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveLocalVote = async (issueId: string | number, hasVoted: boolean) => {
  try {
    const votes = await getLocalVotes();
    votes[String(issueId)] = hasVoted;
    await setItemAsync('local_votes', JSON.stringify(votes));
  } catch (e) {
    console.warn('Failed to save local vote', e);
  }
};
// ---------------------------------


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

      if (payload.images) {
        payload.images.forEach((img, index) => {
          const imageType = img.type || 'image/jpeg';
          formData.append(`images[${index}]`, {
            uri: img.uri,
            type: imageType,
            name: img.name,
          } as any);
        });
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

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, payload }: { issueId: number; payload: UpdateIssuePayload }) => {
      const formData = new FormData();
      
      if (payload.title !== undefined) formData.append('title', payload.title);
      if (payload.description !== undefined) formData.append('description', payload.description);
      if (payload.category_id !== undefined) formData.append('category_id', payload.category_id.toString());
      if (payload.location !== undefined) formData.append('location', payload.location);
      if (payload.latitude !== undefined) formData.append('latitude', payload.latitude.toString());
      if (payload.longitude !== undefined) formData.append('longitude', payload.longitude.toString());
      if (payload.status_id !== undefined) formData.append('status_id', payload.status_id.toString());
      if (payload.is_hidden !== undefined) formData.append('is_hidden', payload.is_hidden ? '1' : '0');

      // Imágenes nuevas (archivos)
      if (payload.images) {
        payload.images.forEach((img, index) => {
          if (typeof img === 'object' && img.uri) {
            const fileName = `image_${index}_${Date.now()}.jpg`;
            formData.append(`images[${index}]`, {
              uri: img.uri,
              type: 'image/jpeg',
              name: fileName,
            } as any);
          }
        });
      }

      // IDs de imágenes a eliminar
      if (payload.deleted_images && payload.deleted_images.length > 0) {
        payload.deleted_images.forEach((id, index) => {
          formData.append('deleted_images[]', id.toString());
        });
      }

      formData.append('_method', 'PUT');

      const token = useAuthStore.getState().token;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

      console.log(`[DEBUG] Intentando subida crítica via FETCH a: ${API_URL}/issues/${issueId}`);

      const response = await fetch(`${API_URL}/issues/${issueId}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[DEBUG] Error en subida FETCH:', data);
        throw new Error(data.message || 'Error en la actualización');
      }

      console.log(`[DEBUG] ¡ÉXITO! Respuesta del servidor:`, JSON.stringify(data.images));

      return data;
    },
    onSuccess: (_, { issueId }) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'my-issues'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
    },
  });
};

export const useIssuesFeed = (perPage = 15, filters?: {
  search?: string;
  user_id?: number;
  status_id?: number;
  category_id?: number;
}) => {
  const { user } = useAuthStore();
  
  return useInfiniteQuery({
    queryKey: ['issues', 'feed', 'infinite', perPage, filters, user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = { per_page: perPage, page: pageParam };
      if (filters?.search) params.search = filters.search;
      if (filters?.user_id) params.user_id = filters.user_id;
      if (filters?.status_id) params.status_id = filters.status_id;
      if (filters?.category_id) params.category_id = filters.category_id;
      
      if (user?.id) params.voter_id = user.id;

      const response = await apiClient.get<PaginatedResponse<Issue>>('/issues/feed', { params });
      
      const localVotes = await getLocalVotes();
      if (response.data && response.data.data) {
        response.data.data = response.data.data.map(issue => {
          const localVote = localVotes[String(issue.id)];
          if (localVote !== undefined && issue.has_voted === undefined) {
            return { ...issue, has_voted: localVote };
          }
          if (issue.has_voted !== undefined) {
            saveLocalVote(issue.id, !!issue.has_voted);
          }
          return issue;
        });
      }
      
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.current_page < lastPage.last_page) {
        return lastPage.current_page + 1;
      }
      return undefined;
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
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['issues', 'details', id ? String(id) : null, userId],
    queryFn: async () => {
      if (!id) return null;
      // Pasamos user_id y voter_id como parámetro para que el backend sepa si este usuario ya votó
      const response = await apiClient.get<any>(`/issues/${id}`, {
        params: userId ? { user_id: userId, voter_id: userId } : {}
      });
      
      // Manejar posibles respuestas envueltas en { data: ... }
      let issueData = response.data;
      if (issueData && issueData.data && !issueData.title) {
        issueData = issueData.data;
      }
      
      // LOG para depuración: Ver la estructura real que llega
      console.log(`[DEBUG] useIssueDetails(${id}) - Keys:`, Object.keys(issueData || {}));
      
      // ESTRATEGIA DE FALLBACK: Si el detalle no trae votos, buscamos en el caché del feed
      // ya que sabemos que el feed sí suele traer estos contadores.
      let fallbackUpvotes = undefined;
      let fallbackHasVoted = undefined;

      if (issueData.upvotes_count == null) {
        const feedQueries = queryClient.getQueriesData<any>({ queryKey: ['issues', 'feed'] });
        for (const [_, feed] of feedQueries) {
          if (!feed) continue;

          const items: Issue[] = feed.pages
            ? feed.pages.flatMap((p: any) => p.data || [])
            : feed.data || [];

          const found = items.find(i => String(i.id) === String(id));
          if (found && found.upvotes_count != null) {
            fallbackUpvotes = found.upvotes_count;
            fallbackHasVoted = found.has_voted;
            console.log(`[DEBUG] Fallback encontrado en feed: upvotes=${fallbackUpvotes}, voted=${fallbackHasVoted}`);
            break;
          }
        }
      }

      // Último recurso: revisar caché local de votos
      const localVotes = await getLocalVotes();
      const localVote = localVotes[String(id)];

      // Asegurar que has_voted y upvotes_count existan con nombres alternativos o fallbacks
      const issue: Issue = {
        ...issueData,
        has_voted: !!(issueData.has_voted ?? issueData.voted ?? fallbackHasVoted ?? localVote ?? false),
        upvotes_count: issueData.upvotes_count ?? issueData.total_upvotes ?? fallbackUpvotes ?? 0
      };
      
      // Sincronizar caché local si el backend sí envió el dato
      if (id && (issueData.has_voted !== undefined || issueData.voted !== undefined)) {
        saveLocalVote(id, !!issue.has_voted);
      }
      
      console.log(`[DEBUG] useIssueDetails(${id}) - Final state -> has_voted:`, issue.has_voted, 'upvotes:', issue.upvotes_count);
      
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
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (issueId: number | string) => {
      console.log(`[DEBUG] Iniciando toggle-upvote para issue ${issueId}`);
      // Enviamos el ID del usuario en el body para que el backend sepa quién vota
      const response = await apiClient.post(`/issues/${issueId}/toggle-upvote`, {
        voter_id: user?.id,
        user_id: user?.id // Enviamos ambos por si acaso
      });
      return response.data;
    },
    // Optimistic update for better UX
    onMutate: async (issueId) => {
      const idStr = String(issueId);
      const userId = user?.id;
      
      // Cancelar cualquier refetch en curso
      await queryClient.cancelQueries({ queryKey: ['issues', 'details', idStr] });
      await queryClient.cancelQueries({ queryKey: ['issues', 'feed'] });

      // Guardar el estado anterior buscando la query exacta con userId
      const detailsQueryKey = ['issues', 'details', idStr, userId];
      const previousIssue = queryClient.getQueryData<Issue>(detailsQueryKey);

      const newHasVoted = previousIssue ? !previousIssue.has_voted : true;
      
      // Actualizar el caché local permanentemente
      saveLocalVote(issueId, newHasVoted);

      console.log(`[DEBUG] onMutate - Estado previo has_voted:`, previousIssue?.has_voted, `-> Nuevo:`, newHasVoted);

      // Actualizar optimísticamente el caché de detalles
      if (previousIssue) {
        queryClient.setQueryData<Issue>(detailsQueryKey, {
          ...previousIssue,
          has_voted: newHasVoted,
          upvotes_count: Math.max(0, (previousIssue.upvotes_count || 0) + (previousIssue.has_voted ? -1 : 1)),
        });
      }

      // También actualizar en el feed si aparece ahí
      queryClient.setQueriesData<PaginatedResponse<Issue> | { pages: PaginatedResponse<Issue>[]; pageParams: unknown[] }>({ queryKey: ['issues', 'feed'] }, (old) => {
        if (!old) return old;

        // Handle InfiniteData structure (useInfiniteQuery)
        if ('pages' in old && Array.isArray((old as any).pages)) {
          return {
            ...old,
            pages: (old as any).pages.map((page: PaginatedResponse<Issue>) => ({
              ...page,
              data: page.data.map(item => {
                if (String(item.id) === idStr) {
                  const currentlyVoted = !!item.has_voted;
                  return {
                    ...item,
                    has_voted: !currentlyVoted,
                    upvotes_count: Math.max(0, (item.upvotes_count || 0) + (currentlyVoted ? -1 : 1)),
                  };
                }
                return item;
              })
            }))
          };
        }

        // Handle regular PaginatedResponse (useQuery)
        if ('data' in old && Array.isArray((old as any).data)) {
          return {
            ...old,
            data: (old as any).data.map((item: Issue) => {
              if (String(item.id) === idStr) {
                const currentlyVoted = !!item.has_voted;
                return {
                  ...item,
                  has_voted: !currentlyVoted,
                  upvotes_count: Math.max(0, (item.upvotes_count || 0) + (currentlyVoted ? -1 : 1)),
                };
              }
              return item;
            })
          };
        }

        return old;
      });

      return { previousIssue, detailsQueryKey };
    },
    onSuccess: (data, issueId, context) => {
      console.log(`[DEBUG] toggle-upvote exitoso. Respuesta:`, data);
      // Si el servidor devuelve el objeto issue actualizado, lo usamos directamente
      if (data && (data.has_voted !== undefined || data.upvotes_count !== undefined)) {
        if (context.detailsQueryKey) {
          queryClient.setQueryData(context.detailsQueryKey, (old: any) => ({
            ...old,
            ...data,
            has_voted: !!data.has_voted // Asegurar booleano
          }));
        }
      }
    },
    onError: (err: any, issueId, context: any) => {
      console.error(`[DEBUG] Error en toggle-upvote:`, err?.response?.data || err);
      // Revertir al estado anterior si hay error
      if (context?.previousIssue && context.detailsQueryKey) {
        queryClient.setQueryData(context.detailsQueryKey, context.previousIssue);
      }
    },
    onSettled: (data, error, issueId) => {
      const idStr = String(issueId);
      const userId = user?.id;
      // Invalida para asegurar sincronización con el servidor
      // Añadimos un pequeño delay para dar tiempo al backend si es necesario
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr, userId] });
        queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
        queryClient.invalidateQueries({ queryKey: ['issues', 'my-issues'] });
      }, 500);
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
      const response = await apiClient.post('/assignments', {
        issue_id: issueId,
        worker_id: workerId,
        status_id: 1,
        notes: notes || '',
        assigned_at: new Date().toISOString(),
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
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['users', 'workers'],
    queryFn: async () => {
      if (!isAdmin) return [];
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
        return roleId === 2 || roleName.includes('work') || roleName.includes('trabaj');
      });

      return workers;
    },
    enabled: isAdmin,
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
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['admin', 'issues', filters],
    queryFn: async () => {
      if (!isAdmin) return { data: [], total: 0 };
      const params: Record<string, any> = {};
      if (filters?.is_hidden !== undefined) params.is_hidden = filters.is_hidden ? 1 : 0;
      if (filters?.status_id) params.status_id = filters.status_id;
      if (filters?.category_id) params.category_id = filters.category_id;
      if (filters?.search) params.search = filters.search;
      params.per_page = filters?.per_page || 50;

      const response = await apiClient.get<PaginatedResponse<Issue>>('/admin/issues', { params });
      return response.data;
    },
    enabled: isAdmin,
  });
};

/**
 * Edit any issue as admin.
 * POST /api/admin/issues/{id} with _method: PUT
 */
export const useAdminUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, payload }: { issueId: number; payload: AdminUpdateIssuePayload }) => {
      const formData = new FormData();
      
      if (payload.title !== undefined) formData.append('title', payload.title);
      if (payload.description !== undefined) formData.append('description', payload.description);
      if (payload.category_id !== undefined) formData.append('category_id', payload.category_id.toString());
      if (payload.location !== undefined) formData.append('location', payload.location);
      if (payload.latitude !== undefined) formData.append('latitude', payload.latitude.toString());
      if (payload.longitude !== undefined) formData.append('longitude', payload.longitude.toString());
      if (payload.status_id !== undefined) formData.append('status_id', payload.status_id.toString());
      if (payload.is_hidden !== undefined) formData.append('is_hidden', payload.is_hidden ? '1' : '0');
      if (payload.hidden_reason !== undefined) formData.append('hidden_reason', payload.hidden_reason);

      // Imágenes nuevas (archivos)
      if (payload.images) {
        payload.images.forEach((img, index) => {
          if (typeof img === 'object' && img.uri) {
            const fullUri = img.uri;
            const fileName = `admin_image_${index}_${Date.now()}.jpg`;

            formData.append(`images[${index}]`, {
              uri: fullUri,
              type: 'image/jpeg',
              name: fileName,
            } as any);
          }
        });
      }

      // IDs de imágenes a eliminar
      if (payload.deleted_images && payload.deleted_images.length > 0) {
        payload.deleted_images.forEach((id, index) => {
          formData.append('deleted_images[]', id.toString());
        });
      }

      // IMPORTANTE: Laravel y otros frameworks requieren POST + _method: PUT 
      // para procesar archivos en una actualización.
      formData.append('_method', 'PUT');

      const response = await apiClient.post(`/admin/issues/${issueId}`, formData);

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

