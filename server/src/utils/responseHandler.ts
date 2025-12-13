/**
 * Response Handler Utilities
 * Standardized API response formatting
 */

import { Response } from 'express';

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number
): void {
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  res.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore,
    },
  } as PaginatedResponse<T>);
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Send created response (201)
 */
export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendSuccess(res, data, 201, message);
}

/**
 * Send no content response (204)
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  error: string,
  statusCode = 500,
  details?: any
): void {
  const response: ErrorResponse = {
    success: false,
    error,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
}
