import api from './api';

export const leadsService = {
  getAll: async (params?: any) => {
    const response = await api.get('/leads', { params });
    // Backend returns {success, data, total, page, etc}
    return response.data;
  },

  getById: async (id: string) => {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid lead ID');
    }
    const response = await api.get(`/leads/${id}`);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/leads', data);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/leads/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  analyze: async (id: string) => {
    const response = await api.post(`/leads/${id}/analyze`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/leads/stats');
    return response.data;
  },
};

export const tasksService = {
  getAll: async (params?: any) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await api.patch(`/tasks/${id}/complete`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  getUpcoming: async (days: number = 7) => {
    const response = await api.get('/tasks/upcoming', { params: { days } });
    return response.data;
  },
};

export const analyticsService = {
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getRevenue: async (months?: number) => {
    const response = await api.get('/analytics/revenue', { params: { months } });
    return response.data;
  },

  getProfitMargins: async () => {
    const response = await api.get('/analytics/profit-margins');
    return response.data;
  },

  getCosts: async () => {
    const response = await api.get('/analytics/costs');
    return response.data;
  },

  getSuggestions: async () => {
    const response = await api.get('/automation/suggestions');
    return response.data;
  },

  getLeadAnalytics: async () => {
    const response = await api.get('/analytics/leads');
    return response.data;
  },
};

export const projectsService = {
  getAll: async (params?: any) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/projects', data);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/projects/stats');
    return response.data;
  },
};

export const quotesService = {
  getAll: async (params?: any) => {
    const response = await api.get('/quotes', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/quotes/${id}`);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/quotes', data);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/quotes/${id}`, data);
    return response.data;
  },

  send: async (id: string) => {
    const response = await api.post(`/quotes/${id}/send`);
    return response.data;
  },

  convertToInvoice: async (id: string) => {
    const response = await api.post(`/quotes/${id}/convert-to-invoice`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/quotes/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/quotes/stats');
    return response.data;
  },
};

export const invoicesService = {
  getAll: async (params?: any) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/invoices', data);
    // Backend returns {success, data}
    return response.data?.data || response.data;
  },

  send: async (id: string) => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  recordPayment: async (id: string, data: any) => {
    const response = await api.post(`/invoices/${id}/payments`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/invoices/stats');
    return response.data;
  },

  getOverdue: async () => {
    const response = await api.get('/invoices/overdue');
    return response.data;
  },
};

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: { name: string; email: string; password: string; company?: string; phone?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

export const financingService = {
  getAll: async (params?: any) => {
    const response = await api.get('/financing', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/financing/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/financing', data);
    return response.data;
  },

  getForLead: async (leadId: string) => {
    const response = await api.get(`/financing?leadId=${leadId}`);
    return response.data;
  },

  getForProject: async (projectId: string) => {
    const response = await api.get(`/financing?projectId=${projectId}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/financing/${id}`, { status });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/financing/stats');
    return response.data;
  },
};

export const materialOrdersService = {
  getAll: async (params?: any) => {
    const response = await api.get('/materials/orders', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/materials/orders/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/materials/orders', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/materials/orders/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/materials/orders/${id}`, { status });
    return response.data;
  },
};

export const subcontractorsService = {
  getAll: async (params?: any) => {
    const response = await api.get('/subcontractors', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/subcontractors/${id}`);
    return response.data;
  },

  search: async (params: any) => {
    const response = await api.get('/subcontractors/search', { params });
    return response.data;
  },

  hire: async (data: any) => {
    const response = await api.post('/subcontractors/hire', data);
    return response.data;
  },

  getHires: async (params?: any) => {
    const response = await api.get('/subcontractors/hires', { params });
    return response.data;
  },

  updateHireStatus: async (hireId: string, status: string) => {
    const response = await api.patch(`/subcontractors/hires/${hireId}`, { status });
    return response.data;
  },
};
