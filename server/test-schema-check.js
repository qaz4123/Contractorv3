// Test database schema and tables
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres.euypsrhgxsnmvyoysjvf:EdenAbraham30061988@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require',
    },
  },
});

async function checkSchema() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check if User table exists and has data
    try {
      const userCount = await prisma.user.count();
      console.log(`\n👤 Users in database: ${userCount}`);
    } catch (e) {
      console.log(`\n❌ User table error: ${e.message}`);
      console.log('   Schema may need to be migrated');
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    return false;
  }
}

checkSchema().then(success => {
  process.exit(success ? 0 : 1);
});

