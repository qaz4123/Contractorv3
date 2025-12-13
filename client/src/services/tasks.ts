import api from './api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  leadId?: string;
  projectId?: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  lead?: { id: string; name: string };
}

export const tasksService = {
  getAll: async (params?: any) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getToday: async () => {
    const response = await api.get('/tasks/today');
    return response.data;
  },

  getOverdue: async () => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  create: async (data: Partial<Task>) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, data);
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
};
