/**
 * Shared API Response Types
 * Standardized response shapes for backend-frontend communication
 */

/**
 * Standard success response for single items
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard success response for paginated lists
 */
export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Standard error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export type ApiPaginatedResponseType<T> = ApiPaginatedResponse<T> | ApiErrorResponse;

