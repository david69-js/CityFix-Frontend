import apiClient from './axios';
import {
  ReportSummary,
  CategoryReport,
  WorkerReport,
  DateReport,
  ResolutionReport,
  IssueDetail,
  PaginatedResponse,
} from '../types/reports';

const DEFAULT_FROM = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const DEFAULT_TO = new Date().toISOString().split('T')[0];

export const ReportsService = {
  summary: (from = DEFAULT_FROM, to = DEFAULT_TO) =>
    apiClient.get<ReportSummary>('/admin/reports/summary', { params: { from, to } }),

  byCategory: (params?: { from?: string; to?: string; category_id?: number }) =>
    apiClient.get<CategoryReport>('/admin/reports/by-category', { params }),

  byWorker: (params?: { from?: string; to?: string; worker_id?: number }) =>
    apiClient.get<WorkerReport>('/admin/reports/by-worker', { params }),

  byDate: (params?: { from?: string; to?: string; group_by?: 'day' | 'week' | 'month' }) =>
    apiClient.get<DateReport>('/admin/reports/by-date', { params }),

  resolutionTimes: (params?: { from?: string; to?: string; category_id?: number }) =>
    apiClient.get<ResolutionReport>('/admin/reports/resolution-times', { params }),

  details: (params?: {
    from?: string;
    to?: string;
    status_id?: number;
    category_id?: number;
    worker_id?: number;
    per_page?: number;
    page?: number;
  }) =>
    apiClient.get<PaginatedResponse<IssueDetail>>('/admin/reports/details', { params }),
};
