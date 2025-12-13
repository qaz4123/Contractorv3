/**
 * Shared Prisma Client Instance
 * Prevents creating multiple database connections
 * With enhanced logging and error handling
 */

// Load environment variables BEFORE Prisma initialization
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Type definitions for Prisma events
interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface LogEvent {
  timestamp: Date;
  message: string;
  target: string;
}

// Ensure DATABASE_URL is configured for Supabase Pooler (pgbouncer)
function prepareDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  // Parse the URL to validate and add pgbouncer parameters
  try {
    const dbUrl = new URL(url);
    
    // Verify this is a Supabase pooler connection (port 6543 or contains pooler)
    const isPooler = dbUrl.port === '6543' || dbUrl.hostname.includes('pooler');
    
    // Ensure username format is correct for Supabase pooler: postgres.<project_ref>
    if (isPooler && dbUrl.username === 'postgres' && !dbUrl.username.includes('.')) {
      console.warn('⚠️  Warning: Supabase pooler requires username format: postgres.<project_ref>');
      console.warn('   Current username:', dbUrl.username);
    }
    
    // Add pgbouncer parameters if using pooler
    if (isPooler) {
      // Remove existing pgbouncer params if any
      dbUrl.searchParams.delete('pgbouncer');
      dbUrl.searchParams.delete('statement_cache_size');
      
      // Add required pgbouncer parameters
      dbUrl.searchParams.set('pgbouncer', 'true');
      dbUrl.searchParams.set('statement_cache_size', '0');
      
      // Ensure SSL is required
      if (!dbUrl.searchParams.has('sslmode')) {
        dbUrl.searchParams.set('sslmode', 'require');
      }
    }
    
    // Log connection details (sanitized)
    const sanitizedUrl = dbUrl.toString().replace(/:[^:@]+@/, ':***@');
    console.log('🔗 Database connection configured:');
    console.log('   Host:', dbUrl.hostname);
    console.log('   Port:', dbUrl.port);
    console.log('   User:', dbUrl.username);
    console.log('   Database:', dbUrl.pathname.substring(1));
    console.log('   Pooler mode:', isPooler ? 'enabled (pgbouncer=true)' : 'disabled');
    console.log('   URL (sanitized):', sanitizedUrl);
    
    return dbUrl.toString();
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error);
    throw new Error(`Invalid DATABASE_URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Prepare database URL with pgbouncer support
const databaseUrl = prepareDatabaseUrl(process.env.DATABASE_URL);

// Create singleton Prisma instance with structured logging
// Prisma will NOT use prepared statements when pgbouncer=true is in the connection string
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Log slow queries for performance monitoring
prisma.$on('query', (e: QueryEvent) => {
  if (e.duration > 1000) { // Log queries taking more than 1 second
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity: 'WARNING',
      message: 'Slow database query detected',
      duration: `${e.duration}ms`,
      query: e.query,
      params: e.params,
    };
    console.warn(JSON.stringify(logEntry));
  }
});

// Log all database errors with structured logging
prisma.$on('error', (e: LogEvent) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: 'ERROR',
    message: 'Database error',
    error: e.message,
    target: e.target,
  };
  console.error(JSON.stringify(logEntry));
});

// Log warnings
prisma.$on('warn', (e: LogEvent) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: 'WARNING',
    message: 'Database warning',
    warning: e.message,
  };
  console.warn(JSON.stringify(logEntry));
});

export default prisma;
