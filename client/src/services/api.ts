import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
}

export interface PaginatedApiResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) return true; // Network errors are retryable
  const status = error.response.status;
  // Retry on 5xx errors and 429 (rate limit)
  return status >= 500 || status === 429;
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Add auth token and correlation ID to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add correlation ID for request tracing
  const correlationId = `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  config.headers['X-Correlation-ID'] = correlationId;
  
  // Add retry count metadata
  (config as any).retryCount = (config as any).retryCount || 0;
  
  return config;
});

// Handle auth errors with automatic token refresh and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; retryCount?: number };

    // Retry logic for retryable errors
    if (isRetryableError(error) && (originalRequest.retryCount || 0) < MAX_RETRIES) {
      originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, originalRequest.retryCount - 1);
      console.log(`Retrying request (attempt ${originalRequest.retryCount}/${MAX_RETRIES}) after ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      // If no refresh token, logout
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { tokens, user } = response.data;

        // Update store and localStorage
        useAuthStore.getState().setAuth(user, tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        // Process queued requests
        processQueue(null, tokens.accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
