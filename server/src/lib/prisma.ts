/**
 * Shared Prisma Client Instance
 * Prevents creating multiple database connections
 * With enhanced logging and error handling
 */

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

// Create singleton Prisma instance with structured logging
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
