#!/usr/bin/env node
/**
 * Run System Reliability Audit
 * This script performs 10x reliability testing on the property analysis system
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting System Reliability Audit...\n');

const auditScript = path.join(__dirname, 'src', 'reliability-audit', 'run-audit.ts');

// Run the TypeScript audit script using tsx
const child = spawn('npx', ['tsx', auditScript], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
});

child.on('error', (error) => {
  console.error('❌ Failed to start audit:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Reliability audit completed successfully\n');
  } else {
    console.log(`\n❌ Reliability audit failed with exit code ${code}\n`);
  }
  process.exit(code || 0);
});
