/**
 * Authentication Service
 * Handles user registration, login, and token management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { config } from '../../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: string;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private refreshExpiresInDays: number;

  constructor() {
    this.jwtSecret = config.jwt.secret || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = config.jwt.expiresIn;
    this.refreshExpiresInDays = config.jwt.refreshExpiresInDays;
    
    // Validate JWT secret on initialization
    if (!this.jwtSecret || this.jwtSecret === 'your-secret-key-change-in-production') {
      if (config.isProduction()) {
        throw new Error('JWT_SECRET must be properly configured in production');
      }
      console.warn('⚠️ Using default JWT_SECRET - this is insecure!');
    }
  }

  /**
   * Handle database errors and return appropriate user-friendly messages
   */
  private handleDatabaseError(error: any, context: 'registration' | 'login'): { success: false; error: string } {
    // Prisma unique constraint violation
    if (error.code === 'P2002') {
      return { success: false, error: 'A user with this email already exists' };
    }
    // Prisma connection errors (P1001: Can't reach database, P1002: Database timeout)
    if (error.code === 'P1001' || error.code === 'P1002') {
      return { success: false, error: 'Database connection error. Please try again later or contact support.' };
    }
    // Other Prisma errors (all start with 'P')
    if (error.code?.startsWith('P')) {
      return { success: false, error: 'Database error. Please try again later.' };
    }
    // Default fallback error
    return { 
      success: false, 
      error: context === 'registration' 
        ? 'Registration failed. Please try again.' 
        : 'Login failed. Please check your credentials and try again.'
    };
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string, company?: string): Promise<AuthResult> {
    try {
      // Validate and normalize email
      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Sanitize name (remove extra spaces, trim)
      const sanitizedName = name.trim().replace(/\s+/g, ' ');
      if (sanitizedName.length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return { success: false, error: 'A user with this email already exists' };
      }

      // Validate password strength
      if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      // Check password has at least one letter and one number
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return { success: false, error: 'Password must contain at least one letter and one number' };
      }

      // Hash password (10 rounds is a good balance between security and speed)
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: sanitizedName,
          company: company?.trim() ? company.trim() : undefined,
          role: UserRole.CONTRACTOR,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return this.handleDatabaseError(error, 'registration');
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return this.handleDatabaseError(error, 'login');
    }
  }

  /**
   * Refresh access token
   * Fixed: Generate new token BEFORE deleting old one to prevent race condition
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Find the refresh token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        return { success: false, error: 'Invalid token' };
      }

      // Check if expired
      if (tokenRecord.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        return { success: false, error: 'Token expired' };
      }

      // Generate new tokens FIRST (before deleting old one)
      const tokens = await this.generateTokens(tokenRecord.user);

      // Only delete old refresh token after new one is successfully created
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

      return {
        success: true,
        user: {
          id: tokenRecord.user.id,
          email: tokenRecord.user.email,
          name: tokenRecord.user.name,
          role: tokenRecord.user.role,
        },
        tokens,
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return { success: false, error: 'Token refresh error' };
    }
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(refreshToken: string): Promise<boolean> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify access token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: { id: string; email: string; role: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Generate access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    );

    // Generate refresh token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresInDays);

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Parse expires in to seconds
    const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Parse JWT expires in string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default 24 hours

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 86400;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      if (newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters' };
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Invalidate all refresh tokens
      await prisma.refreshToken.deleteMany({ where: { userId } });

      return { success: true };
    } catch {
      return { success: false, error: 'Password change error' };
    }
  }

  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Request password reset - generates a reset token
   * In production, this would send an email with the reset link
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string; resetToken?: string }> {
    try {
      const user = await prisma.user.findUnique({ 
        where: { email: email.toLowerCase() } 
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true };
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Hash the token before storing (security best practice)
      const hashedToken = this.hashToken(resetToken);

      // Store hashed reset token in refresh_tokens table with special prefix
      await prisma.refreshToken.create({
        data: {
          token: `reset_${hashedToken}`,
          userId: user.id,
          expiresAt: resetExpires,
        },
      });

      // In production, send email here
      // For now, return the token (would be in email link)
      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

      return { success: true, resetToken };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: true }; // Don't reveal errors
    }
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Hash the incoming token to match stored hash
      const hashedToken = this.hashToken(resetToken);
      
      // Find the reset token
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: `reset_${hashedToken}` },
        include: { user: true },
      });

      if (!tokenRecord) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      // Check if expired
      if (tokenRecord.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        return { success: false, error: 'Reset token has expired. Please request a new one.' };
      }

      // Validate new password
      if (newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return { success: false, error: 'Password must contain at least one letter and one number' };
      }

      // Update password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      });

      // Delete the reset token
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

      // Invalidate all other refresh tokens for this user
      await prisma.refreshToken.deleteMany({ 
        where: { userId: tokenRecord.userId } 
      });

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }
}

// Export singleton
export const authService = new AuthService();
