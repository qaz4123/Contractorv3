import api from './api';
import type { ApiResponse, ApiPaginatedResponseType } from '../../../shared/api-types';

export const leadsService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/leads', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch leads');
    }
    return response.data;
  },

  getById: async (id: string) => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid lead ID');
    }
    const response = await api.get<ApiResponse<any>>(`/leads/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch lead');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/leads', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create lead');
    }
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse<any>>(`/leads/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update lead');
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/leads/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete lead');
    }
    return response.data;
  },

  analyze: async (id: string) => {
    const response = await api.post<ApiResponse<any>>(`/leads/${id}/refresh-intelligence`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to analyze lead');
    }
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/leads/stats');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch stats');
    }
    return response.data.data;
  },
};

export const tasksService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/tasks', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch tasks');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch task');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/tasks', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create task');
    }
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse<any>>(`/tasks/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update task');
    }
    return response.data.data;
  },

  complete: async (id: string) => {
    const response = await api.patch<ApiResponse<any>>(`/tasks/${id}/complete`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to complete task');
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/tasks/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete task');
    }
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/tasks/stats');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch stats');
    }
    return response.data.data;
  },

  getUpcoming: async () => {
    // Backend has /tasks/today instead of /tasks/upcoming
    // Fetch today's tasks as a fallback
    const response = await api.get<ApiResponse<any>>('/tasks/today');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch upcoming tasks');
    }
    return response.data.data;
  },
};

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get<ApiResponse<any>>('/analytics/dashboard');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch dashboard');
    }
    return response.data.data;
  },

  getDashboardStats: async () => {
    const response = await api.get<ApiResponse<any>>('/analytics/dashboard');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch dashboard stats');
    }
    return response.data.data;
  },

  getRevenue: async (months?: number) => {
    const response = await api.get<ApiResponse<any>>('/analytics/revenue', { params: { months } });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch revenue');
    }
    return response.data.data;
  },

  getProfitMargins: async () => {
    const response = await api.get<ApiResponse<any>>('/analytics/profit-margins');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch profit margins');
    }
    return response.data.data;
  },

  getCosts: async () => {
    const response = await api.get<ApiResponse<any>>('/analytics/costs');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch costs');
    }
    return response.data.data;
  },

  getSuggestions: async () => {
    const response = await api.get<ApiResponse<any>>('/automation/suggestions');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch suggestions');
    }
    return response.data.data;
  },

  getLeadAnalytics: async () => {
    const response = await api.get<ApiResponse<any>>('/analytics/leads');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch lead analytics');
    }
    return response.data.data;
  },
};

export const projectsService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/projects', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch projects');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/projects/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch project');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/projects', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create project');
    }
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse<any>>(`/projects/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update project');
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/projects/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete project');
    }
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/projects/stats');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch stats');
    }
    return response.data.data;
  },
};

export const quotesService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/quotes', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch quotes');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/quotes/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch quote');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/quotes', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create quote');
    }
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put<ApiResponse<any>>(`/quotes/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update quote');
    }
    return response.data.data;
  },

  send: async (id: string) => {
    const response = await api.post<ApiResponse<any>>(`/quotes/${id}/send`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send quote');
    }
    return response.data.data;
  },

  convertToInvoice: async (id: string) => {
    const response = await api.post<ApiResponse<any>>(`/quotes/${id}/convert-to-invoice`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to convert quote to invoice');
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/quotes/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete quote');
    }
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/quotes/stats');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch stats');
    }
    return response.data.data;
  },
};

export const invoicesService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/invoices', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch invoices');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/invoices/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch invoice');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/invoices', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create invoice');
    }
    return response.data.data;
  },

  send: async (id: string) => {
    const response = await api.post<ApiResponse<any>>(`/invoices/${id}/send`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send invoice');
    }
    return response.data.data;
  },

  recordPayment: async (id: string, data: any) => {
    const response = await api.post<ApiResponse<any>>(`/invoices/${id}/payments`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to record payment');
    }
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/invoices/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete invoice');
    }
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/invoices/stats');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch stats');
    }
    return response.data.data;
  },

  getOverdue: async () => {
    const response = await api.get<ApiResponse<any>>('/invoices/overdue');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch overdue invoices');
    }
    return response.data.data;
  },
};

// Re-export authService from auth.ts for consistency
export { authService } from './auth';

export const financingService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/financing', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch financing offers');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/financing/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch financing offer');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/financing', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create financing offer');
    }
    return response.data.data;
  },

  getForLead: async (leadId: string) => {
    const response = await api.get<ApiPaginatedResponseType<any>>(`/financing?leadId=${leadId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch financing for lead');
    }
    return response.data;
  },

  getForProject: async (projectId: string) => {
    const response = await api.get<ApiPaginatedResponseType<any>>(`/financing?projectId=${projectId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch financing for project');
    }
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch<ApiResponse<any>>(`/financing/${id}`, { status });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update financing status');
    }
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/financing/stats');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch stats');
    }
    return response.data.data;
  },
};

export const materialOrdersService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/materials/orders', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch material orders');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/materials/orders/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch material order');
    }
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/materials/orders', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create material order');
    }
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch<ApiResponse<any>>(`/materials/orders/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update material order');
    }
    return response.data.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch<ApiResponse<any>>(`/materials/orders/${id}`, { status });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update material order status');
    }
    return response.data.data;
  },
};

export const subcontractorsService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/subcontractors', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch subcontractors');
    }
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/subcontractors/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch subcontractor');
    }
    return response.data.data;
  },

  search: async (params: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/subcontractors/search', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to search subcontractors');
    }
    return response.data;
  },

  hire: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/subcontractors/hire', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to hire subcontractor');
    }
    return response.data.data;
  },

  getHires: async (params?: any) => {
    const response = await api.get<ApiPaginatedResponseType<any>>('/subcontractors/hires', { params });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch hires');
    }
    return response.data;
  },

  updateHireStatus: async (hireId: string, status: string) => {
    const response = await api.patch<ApiResponse<any>>(`/subcontractors/hires/${hireId}`, { status });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update hire status');
    }
    return response.data.data;
  },
};
