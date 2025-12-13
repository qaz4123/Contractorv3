// Test Prisma connection to Supabase
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:EdenAbraham30061988@db.euypsrhgxsnmvyoysjvf.supabase.co:5432/postgres?sslmode=require',
    },
  },
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Testing Prisma connection to Supabase...');
    console.log('Connection string (sanitized):', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'Using default');
    
    await prisma.$connect();
    console.log('✅ Prisma connection successful!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as now, version() as version`;
    console.log('Database time:', result[0].now);
    console.log('PostgreSQL version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Prisma connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.meta) {
      console.error('Error meta:', JSON.stringify(error.meta, null, 2));
    }
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

