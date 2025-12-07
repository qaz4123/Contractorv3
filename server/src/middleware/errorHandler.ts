/**
 * Error Handler Middleware
 * Centralized error handling with comprehensive error types
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  details?: any;
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(statusCode: number, message: string, isOperational = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error types for better error handling
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details?: any) {
    super(400, message, true, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, true);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message, true);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`, true);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message, true);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation error', details?: any) {
    super(422, message, true, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message, true);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message, false);
  }
}

/**
 * Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
}

/**
 * Global error handler
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = (req as any).correlationId || 'unknown';
  
  // Structured error logging for Cloud Logging
  const errorLog = {
    timestamp: new Date().toISOString(),
    severity: 'ERROR',
    correlationId,
    error: {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
    },
    httpRequest: {
      requestMethod: req.method,
      requestUrl: req.path,
      userAgent: req.headers['user-agent'],
      remoteIp: req.ip,
    },
  };
  console.error(JSON.stringify(errorLog));

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
      correlationId,
    });
    return;
  }

  // API errors (custom errors)
  if (err instanceof ApiError) {
    const response: any = {
      success: false,
      error: err.message,
      correlationId,
    };
    
    if (err.details) {
      response.details = err.details;
    }
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }
    
    res.status(err.statusCode).json(response);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Authentication token has expired',
    });
    return;
  }

  // Prisma errors with detailed handling
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database operation failed';
    let statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = 400;
        break;
      case 'P2014':
        message = 'Invalid relation data';
        statusCode = 400;
        break;
    }

    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { code: err.code }),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: 'Invalid data format',
    });
    return;
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  const response: any = {
    success: false,
    error: message,
    correlationId,
  };

  // Include stack trace in development for debugging
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
