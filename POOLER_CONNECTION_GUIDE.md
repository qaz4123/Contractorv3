# Connection Pooler Setup Guide

## Problem
- Direct connection fails due to IPv6 connectivity issue on Windows
- Connection pooler can reach server (different error = network works!)

## Solution
Use Supabase Connection Pooler which has better network connectivity.

## Steps to Get Connection String

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select project: `euypsrhgxsnmvyoysjvf`

2. **Navigate to Database Settings**
   - Click "Settings" (gear icon) in left sidebar
   - Click "Database" in settings menu
   - Scroll to "Connection Pooling" section

3. **Copy Connection String**
   - Find "Connection string" field
   - Select "URI" format (not JDBC or other)
   - Copy the entire string
   - It should look like:
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[POOLER_HOST]:6543/postgres?sslmode=require
     ```

4. **Update Environment Variable**
   - Update `server/.env` with the pooler connection string
   - Or set `DATABASE_URL` environment variable

5. **Restart Server**
   - Server will automatically use the new connection string
   - Check `/api/health` to verify connection

## Alternative: Manual Format
If you can't access dashboard, try:
```
postgresql://postgres.euypsrhgxsnmvyoysjvf:EdenAbraham30061988@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

But the exact format from dashboard is recommended.

