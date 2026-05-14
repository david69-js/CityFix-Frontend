import { useQuery } from '@tanstack/react-query';
import { ReportsService } from '../api/reports';
import { useAuthStore } from '../store/authStore';

export const useReportSummary = (from?: string, to?: string) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['reports', 'summary', from, to],
    queryFn: async () => {
      const response = await ReportsService.summary(from, to);
      return response.data;
    },
    enabled: isAdmin,
  });
};

export const useCategoryReport = (params?: { from?: string; to?: string; category_id?: number }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['reports', 'by-category', params],
    queryFn: async () => {
      const response = await ReportsService.byCategory(params);
      return response.data;
    },
    enabled: isAdmin,
  });
};

export const useWorkerReport = (params?: { from?: string; to?: string; worker_id?: number }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['reports', 'by-worker', params],
    queryFn: async () => {
      const response = await ReportsService.byWorker(params);
      return response.data;
    },
    enabled: isAdmin,
  });
};

export const useDateReport = (params?: { from?: string; to?: string; group_by?: 'day' | 'week' | 'month' }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['reports', 'by-date', params],
    queryFn: async () => {
      const response = await ReportsService.byDate(params);
      return response.data;
    },
    enabled: isAdmin,
  });
};

export const useResolutionTimes = (params?: { from?: string; to?: string; category_id?: number }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['reports', 'resolution-times', params],
    queryFn: async () => {
      const response = await ReportsService.resolutionTimes(params);
      return response.data;
    },
    enabled: isAdmin,
  });
};

export const useReportDetails = (params?: {
  from?: string;
  to?: string;
  status_id?: number;
  category_id?: number;
  worker_id?: number;
  per_page?: number;
  page?: number;
}) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role_id === 1;

  return useQuery({
    queryKey: ['reports', 'details', params],
    queryFn: async () => {
      const response = await ReportsService.details(params);
      return response.data;
    },
    enabled: isAdmin,
  });
};
