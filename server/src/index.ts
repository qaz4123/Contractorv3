/**
 * Contractorv3 - Server Entry Point
 * Clean, modular architecture with AI-powered lead intelligence
 */

// Load environment variables from .env file (for local development)
// In production (Cloud Run), environment variables are set via --set-env-vars and --set-secrets
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import prisma from './lib/prisma';
import { config } from './config';

// Validate configuration on startup
try {
  config.validate();
  console.log('✅ Configuration validated successfully');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Configuration validation failed:', errorMessage);
  // In development, allow server to start with warnings (for testing without DB)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  Continuing in development mode despite validation errors...');
    console.warn('   Some features may not work correctly.');
  }
}

// Database connection state
let dbConnected = false;

// Demo user credentials
const DEMO_USER = {
  email: 'demo@contractorcrm.com',
  password: 'Demo123!',
  name: 'Demo Contractor',
};

/**
 * Create demo user if doesn't exist
 * Only runs in development or when AUTH_DISABLED=true
 */
async function createDemoUser() {
  // Allow enabling demo user in production via explicit flag (off by default)
  const allowDemoInProd = process.env.ENABLE_DEMO_USER === 'true';

  // Only create demo user in development unless flag is set
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_DISABLED !== 'true' && !allowDemoInProd) {
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: DEMO_USER.email },
    });
    
    if (!existing) {
      const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
      await prisma.user.create({
        data: {
          email: DEMO_USER.email,
          passwordHash,
          name: DEMO_USER.name,
          company: 'Demo Construction LLC',
          role: 'CONTRACTOR',
        },
      });
      console.log('✅ Demo user created: demo@contractorcrm.com / Demo123!');
    } else {
      console.log('ℹ️  Demo user already exists');
    }
  } catch (error) {
    console.warn('⚠️  Could not create demo user:', (error as Error).message);
  }
}

// Create Express app
const app = express();

// Trust proxy for Cloud Run (needed for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SPA
  crossOriginEmbedderPolicy: false,
}));

// Compression for faster responses
app.use(compression());

// CORS
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging with correlation IDs and structured logging
app.use((req, res, next) => {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Add correlation ID to request for downstream use
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Structured logging for Cloud Logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
      correlationId,
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.path,
        status: res.statusCode,
        latency: `${duration}ms`,
        userAgent: req.headers['user-agent'],
        remoteIp: req.ip,
      },
    };
    console.log(JSON.stringify(logEntry));
  });
  next();
});

// Root health check (for Cloud Run)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API health check with more details
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      tavily: !!process.env.TAVILY_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      maps: !!(process.env.MAPS_API_KEY || process.env.VITE_MAPS_API_KEY)
    },
    environment: process.env.NODE_ENV || 'development',
    version: '3.0.0'
  });
});

// API routes
app.use('/api', routes);

// Serve static files (both dev and production)
const staticPath = process.env.NODE_ENV === 'production' ? 'public' : '../client/dist';
app.use(express.static(staticPath));

// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile('index.html', { root: staticPath });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = Number(process.env.PORT) || 8080;

async function main() {
  try {
    // Start server FIRST (for Cloud Run health checks)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // Log safe configuration
      console.log('\n📋 Configuration:');
      const safeConfig = config.getSafeConfig();
      console.log(JSON.stringify(safeConfig, null, 2));
    });

    // Log DATABASE_URL (sanitized) for debugging
    const dbUrl = process.env.DATABASE_URL || '';
    const sanitizedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
    console.log('🔗 DATABASE_URL (sanitized):', sanitizedUrl);

    // Then connect to database with retry logic
    const connectWithRetry = async (retries = 3, delay = 5000): Promise<boolean> => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`🔌 Attempting database connection (attempt ${i + 1}/${retries})...`);
          await Promise.race([
            prisma.$connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 30s')), 30000))
          ]);
          console.log('✅ Database connected');
          dbConnected = true;
          return true;
        } catch (err) {
          const error = err as Error & { code?: string; meta?: any };
          console.warn(`⚠️ Connection attempt ${i + 1} failed:`, error.message);
          if (i < retries - 1) {
            console.log(`⏳ Waiting ${delay/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      return false;
    };

    try {
      dbConnected = await connectWithRetry(3, 5000);
      if (dbConnected) {
        // Create demo user if doesn't exist
        await createDemoUser();
      } else {
        console.warn('⚠️ Running without database persistence after all retries failed');
      }
    } catch (dbError) {
      console.error('⚠️ Database connection failed:', (dbError as Error).message);
      console.warn('⚠️ Running without database persistence');
    }

    // Check required environment variables
    const requiredVars = process.env.NODE_ENV === 'production' ? ['DATABASE_URL'] : [];
    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      console.error('   Server cannot start without these variables.');
    } else if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ DATABASE_URL not set - database features will not work`);
      console.warn('   To set up a local database:');
      console.warn('   1. Install PostgreSQL or use a cloud database');
      console.warn('   2. Create a .env file in server/ directory');
      console.warn('   3. Add: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"');
    }

    // Check optional API keys
    if (!process.env.TAVILY_API_KEY) {
      console.warn('⚠️ TAVILY_API_KEY not set - property search will not work');
    }
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not set - AI analysis will not work');
    }

    console.log(`
🔌 Database: ${dbConnected ? 'Connected' : 'Not connected (running without persistence)'}
🔍 Search: ${process.env.TAVILY_API_KEY ? 'Configured' : 'Not configured'}
🤖 AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}
    `);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
