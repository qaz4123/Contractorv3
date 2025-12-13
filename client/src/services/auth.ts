import api from './api';
import { useAuthStore } from '../store/authStore';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
  },

  updateProfile: async (_data: { name?: string; company?: string; email?: string }) => {
    // Note: Backend doesn't have a profile update endpoint yet
    // This is a placeholder - returns current user data
    // TODO: Implement PUT /api/auth/profile or PUT /api/users/me endpoint
    const response = await api.get('/auth/me');
    if (response.data.success) {
      return {
        success: true,
        user: response.data.data,
        tokens: {
          accessToken: useAuthStore.getState().token || '',
          refreshToken: useAuthStore.getState().refreshToken || '',
          expiresIn: 86400,
        },
      };
    }
    throw new Error('Failed to fetch user profile');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
