// Direct Supabase connection test
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:EdenAbraham30061988@db.euypsrhgxsnmvyoysjvf.supabase.co:5432/postgres?sslmode=require';

async function testConnection() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('Testing direct PostgreSQL connection...');
    console.log('Host:', 'db.euypsrhgxsnmvyoysjvf.supabase.co');
    console.log('Port: 5432');
    console.log('SSL: require');
    
    await client.connect();
    console.log('✅ Direct connection successful!');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('Database time:', result.rows[0].now);
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Direct connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.code) {
      console.error('Error code meaning:', {
        'ECONNREFUSED': 'Connection refused - server not running or firewall blocking',
        'ETIMEDOUT': 'Connection timeout - network issue or server not responding',
        'ENOTFOUND': 'DNS resolution failed - hostname not found',
        '28000': 'Invalid authorization - wrong password or user',
        '28P01': 'Password authentication failed',
      }[error.code] || 'Unknown error code');
    }
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});

