/**
 * Central Configuration Service
 * Manages all environment variables and application configuration
 * Validates required variables on startup
 */

interface DatabaseConfig {
  url: string;
  poolSize: number;
  connectionTimeout: number;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresInDays: number;
}

interface APIConfig {
  tavilyKey: string | null;
  geminiKey: string | null;
  mapsKey: string | null;
}

interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  authDisabled: boolean;
}

interface CacheConfig {
  ttlMinutes: number;
  maxSize: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JWTConfig;
  api: APIConfig;
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
}

class ConfigService {
  private config: Config;
  private validated: boolean = false;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    return {
      server: {
        port: parseInt(process.env.PORT || '8080', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || '*',
        authDisabled: process.env.AUTH_DISABLED === 'true',
      },
      database: {
        url: process.env.DATABASE_URL || '',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
        connectionTimeout: parseInt(process.env.DB_TIMEOUT || '10000', 10),
      },
      jwt: {
        secret: process.env.JWT_SECRET || '',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresInDays: parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10),
      },
      api: {
        tavilyKey: process.env.TAVILY_API_KEY || null,
        geminiKey: process.env.GEMINI_API_KEY || null,
        mapsKey: process.env.VITE_MAPS_API_KEY || null,
      },
      cache: {
        ttlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '60', 10),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    };
  }

  /**
   * Validate configuration on startup
   * Throws error if critical configuration is missing
   */
  validate(): void {
    if (this.validated) return;

    const errors: string[] = [];

    // Validate required fields
    if (!this.config.database.url) {
      errors.push('DATABASE_URL is required');
    }

    // In production, JWT secret must be set and strong
    if (this.config.server.nodeEnv === 'production') {
      if (!this.config.jwt.secret || this.config.jwt.secret === 'your-secret-key-change-in-production') {
        errors.push('JWT_SECRET must be set to a strong secret in production');
      }

      if (this.config.jwt.secret.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters in production');
      }

      if (this.config.server.corsOrigin === '*') {
        errors.push('CORS_ORIGIN should be set to specific origins in production');
      }
    }

    // Warn about missing optional API keys
    const warnings: string[] = [];
    if (!this.config.api.geminiKey) {
      warnings.push('GEMINI_API_KEY not set - AI features will not work');
    }
    if (!this.config.api.tavilyKey) {
      warnings.push('TAVILY_API_KEY not set - search features will not work');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    if (warnings.length > 0) {
      console.warn('⚠️  Configuration warnings:');
      warnings.forEach(w => console.warn(`   - ${w}`));
    }

    this.validated = true;
  }

  /**
   * Get server configuration
   */
  get server(): ServerConfig {
    return this.config.server;
  }

  /**
   * Get database configuration
   */
  get database(): DatabaseConfig {
    return this.config.database;
  }

  /**
   * Get JWT configuration
   */
  get jwt(): JWTConfig {
    return this.config.jwt;
  }

  /**
   * Get API keys configuration
   */
  get api(): APIConfig {
    return this.config.api;
  }

  /**
   * Get cache configuration
   */
  get cache(): CacheConfig {
    return this.config.cache;
  }

  /**
   * Get rate limit configuration
   */
  get rateLimit(): RateLimitConfig {
    return this.config.rateLimit;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.server.nodeEnv === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.server.nodeEnv === 'development';
  }

  /**
   * Get all configuration (for debugging in development only)
   */
  getAll(): Config {
    if (this.isProduction()) {
      throw new Error('Cannot expose full configuration in production');
    }
    return { ...this.config };
  }

  /**
   * Get safe configuration for logging (excludes secrets)
   */
  getSafeConfig(): any {
    return {
      server: {
        port: this.config.server.port,
        nodeEnv: this.config.server.nodeEnv,
        corsOrigin: this.config.server.corsOrigin,
        authDisabled: this.config.server.authDisabled,
      },
      database: {
        connected: !!this.config.database.url,
        poolSize: this.config.database.poolSize,
      },
      api: {
        hasGeminiKey: !!this.config.api.geminiKey,
        hasTavilyKey: !!this.config.api.tavilyKey,
        hasMapsKey: !!this.config.api.mapsKey,
      },
      cache: this.config.cache,
      rateLimit: this.config.rateLimit,
    };
  }
}

// Export singleton instance
export const config = new ConfigService();

// Export types for use in other modules
export type { Config, ServerConfig, DatabaseConfig, JWTConfig, APIConfig, CacheConfig, RateLimitConfig };
