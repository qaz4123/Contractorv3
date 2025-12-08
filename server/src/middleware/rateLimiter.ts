/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Get rate limiter configuration
 * Lazy-loaded to ensure config is initialized
 */
function getRateLimitConfig() {
  return {
    windowMs: config.rateLimit.windowMs,
    maxRequests: config.rateLimit.maxRequests,
  };
}

/**
 * Standard rate limiter for general API endpoints
 * Allows 100 requests per 15 minutes by default
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Default 15 minutes
  max: 100, // Default max
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Strict rate limiter for sensitive operations
 * Allows 10 requests per 15 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many requests to this sensitive endpoint. Please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Authentication rate limiter
 * Allows 10 login/register attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Registration rate limiter
 * Allows 10 registrations per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password change rate limiter
 * Allows 5 password changes per hour
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Too many password change attempts. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI/Search operation rate limiter
 * Allows 20 AI operations per hour (expensive operations)
 */
export const aiOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    error: 'AI operation limit reached. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * File upload rate limiter
 * Allows 50 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    error: 'Upload limit reached. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Read-only endpoint limiter (more permissive)
 * Allows 200 requests per 15 minutes
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Write operation limiter
 * Allows 50 mutations per 15 minutes
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    error: 'Too many write operations. Please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Export all limiters
 */
export default {
  standard: standardLimiter,
  strict: strictLimiter,
  auth: authLimiter,
  register: registerLimiter,
  passwordChange: passwordChangeLimiter,
  aiOperation: aiOperationLimiter,
  upload: uploadLimiter,
  read: readLimiter,
  write: writeLimiter,
};
