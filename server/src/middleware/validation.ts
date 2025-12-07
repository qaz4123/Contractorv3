/**
 * Request Validation Middleware
 * Uses Zod for type-safe validation
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validate request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: messages,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request query params
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: messages,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request params
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: messages,
        });
        return;
      }
      next(error);
    }
  };
}

// ==========================================
// Common Validation Schemas
// ==========================================

export const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const uuidSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const addressSchema = z.object({
  address: z.string().min(5, 'Full address is required').trim(),
  city: z.string().optional(),
  state: z.string().length(2, 'State must be 2-letter code').optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional(),
});

export const phoneSchema = z.string()
  .regex(/^[\d\s\-\(\)\.+]+$/, 'Invalid phone number format')
  .min(10, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .optional()
  .nullable();

export const currencySchema = z.number()
  .min(0, 'Amount must be positive')
  .finite('Amount must be a valid number');

export const dateSchema = z.string()
  .datetime('Invalid date format')
  .or(z.date());

export const urlSchema = z.string()
  .url('Invalid URL format')
  .optional();

// Sanitize string inputs
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};
