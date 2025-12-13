# IPv6 Connection Issue - Potential Fix

## Problem
- Database is working (Supabase logs show connections)
- DNS resolves to IPv6 only: `2600:1f16:1cd0:3321:cc6b:19fb:f5e0:8977`
- Our connection attempts fail: "Can't reach database server"
- Windows may have IPv6 connectivity issues

## Solution Options

### Option 1: Use Connection Pooler (Recommended)
The pooler may have better IPv6 support or use IPv4:
1. Go to Supabase Dashboard → Settings → Database → Connection Pooling
2. Copy the "Connection string" (URI format)
3. Update `DATABASE_URL` in server/.env
4. Restart server

### Option 2: Force IPv4 Resolution
If Supabase provides an IPv4 endpoint, use that instead.

### Option 3: Configure Windows IPv6
1. Check IPv6 is enabled: `Get-NetAdapter | Get-NetIPAddress -AddressFamily IPv6`
2. Ensure Windows has global IPv6 address
3. Test IPv6 connectivity: `Test-NetConnection -ComputerName db.euypsrhgxsnmvyoysjvf.supabase.co -Port 5432`

### Option 4: Use Supabase REST API
Instead of direct PostgreSQL, use Supabase JavaScript client library (requires code changes).

## Current Status
- Database: ✅ Working (logs show connections)
- Our Connection: ❌ Failing (likely IPv6 issue)
- Next Step: Try connection pooler from Supabase dashboard

