/**
 * Auth Routes
 * Handles authentication endpoints
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authService } from '../services/auth/AuthService';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Rate limiters to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window (more reasonable for testing)
  message: { 
    success: false, 
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registrations per hour per IP (more reasonable for testing)
  message: { 
    success: false, 
    error: 'Too many registration attempts. Please try again later.',
    retryAfter: 60 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour (slightly increased)
  message: { 
    success: false, 
    error: 'Too many password change attempts. Please try again later.',
    retryAfter: 60 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * GET /api/auth/register
 * Info endpoint for registration (returns method hint)
 */
router.get('/register', registerLimiter, (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method not allowed. Use POST to register.',
    hint: 'Send a POST request with { email, password, name, company? } to register a new user.',
  });
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  registerLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name, company } = req.body;
    const result = await authService.register(email, password, name, company);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  })
);

/**
 * GET /api/auth/login
 * Info endpoint for login (returns method hint)
 */
router.get('/login', loginLimiter, (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method not allowed. Use POST to login.',
    hint: 'Send a POST request with { email, password } to login.',
  });
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.json(result);
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.json(result);
  })
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  })
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  passwordChangeLimiter,
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user!.userId,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ success: true, message: 'Password changed successfully' });
  })
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  loginLimiter, // Reuse login limiter to prevent abuse
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    });
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post(
  '/reset-password',
  loginLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  })
);

export default router;
