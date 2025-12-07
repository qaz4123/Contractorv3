/**
 * Auth Middleware
 * Protects routes that require authentication
 */

import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth/AuthService';
import { UnauthorizedError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authenticate request - required
 * Use AUTH_DISABLED=true in development to skip authentication
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Allow bypassing auth in development
  if (process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV === 'development') {
    req.user = {
      userId: 'demo-user-id',
      email: 'demo@contractorcrm.com',
      role: 'CONTRACTOR',
    } as TokenPayload;
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw new UnauthorizedError('Token is required');
  }

  try {
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError('Token verification failed');
  }
}

/**
 * Authenticate request - optional
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Admin privileges required',
    });
    return;
  }

  next();
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Requires one of the following roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
