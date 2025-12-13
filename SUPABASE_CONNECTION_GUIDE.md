# Supabase Connection Troubleshooting Guide

## Current Status
❌ **Connection failing**: "Can't reach database server"

## Connection String Used
```
postgresql://postgres:EdenAbraham30061988@db.euypsrhgxsnmvyoysjvf.supabase.co:5432/postgres?sslmode=require
```

## Possible Issues & Solutions

### 1. Database Paused (Most Likely)
Supabase free tier databases pause after inactivity. **Solution:**
- Go to https://supabase.com/dashboard
- Select project: `euypsrhgxsnmvyoysjvf`
- Check if database shows "Paused" status
- Click "Resume" or access the database to wake it up
- Wait 2-5 minutes for full startup

### 2. Use Connection Pooler (Alternative)
Supabase provides a connection pooler that's more reliable:
- **Port**: 6543 (instead of 5432)
- **URL Format**: 
  ```
  postgresql://postgres.EdenAbraham30061988@db.euypsrhgxsnmvyoysjvf.supabase.co:6543/postgres?sslmode=require
  ```
- Note: Username format changes to `postgres.project_ref` for pooler

### 3. Network/Firewall Issues
- Check if your network/firewall allows outbound connections to port 5432 or 6543
- Try from a different network to rule out local firewall

### 4. Project Not Active
- Verify project is active in Supabase dashboard
- Check if project hasn't been deleted or suspended

## Testing Connection

### Test 1: Network Connectivity
```powershell
Test-NetConnection -ComputerName db.euypsrhgxsnmvyoysjvf.supabase.co -Port 5432
Test-NetConnection -ComputerName db.euypsrhgxsnmvyoysjvf.supabase.co -Port 6543
```

### Test 2: Direct Prisma Test
```powershell
cd server
$env:DATABASE_URL="postgresql://postgres:EdenAbraham30061988@db.euypsrhgxsnmvyoysjvf.supabase.co:5432/postgres?sslmode=require"
node test-prisma-connection.js
```

## Next Steps

1. **Check Supabase Dashboard**: Verify database is running/active
2. **Try Connection Pooler**: Use port 6543 with pooler URL format
3. **Check Network**: Ensure firewall allows outbound PostgreSQL connections
4. **Verify Credentials**: Double-check password in Supabase dashboard

## Connection Pooler URL Format

If direct connection doesn't work, try:
```
postgresql://postgres.euypsrhgxsnmvyoysjvf:EdenAbraham30061988@db.euypsrhgxsnmvyoysjvf.supabase.co:6543/postgres?sslmode=require
```

Note: Pooler username is `postgres.project_ref` where `project_ref` is `euypsrhgxsnmvyoysjvf`

