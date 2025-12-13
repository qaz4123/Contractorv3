import api from './api';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  fullAddress: string;
  status: string;
  source?: string;
  leadScore?: number;
  renovationPotential?: number;
  ownerMotivation?: number;
  profitPotential?: number;
  propertyIntel?: any;
  ownerIntel?: any;
  financialIntel?: any;
  permitHistory?: any;
  renovationOpps?: any;
  salesApproach?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadData {
  address: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  source?: string;
}

export const leadsService = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  create: async (data: CreateLeadData) => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Lead>) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/leads/${id}/status`, { status });
    return response.data;
  },

  refreshIntelligence: async (id: string) => {
    const response = await api.post(`/leads/${id}/refresh-intelligence`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/leads/stats');
    return response.data;
  },
};
