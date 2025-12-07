/**
 * Shared Prisma Client Instance
 * Prevents creating multiple database connections
 */

import { PrismaClient } from '@prisma/client';

// Create singleton Prisma instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
