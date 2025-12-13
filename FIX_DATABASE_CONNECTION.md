# Fix Database Connection Issue

## Current Status ✅

- ✅ **Backend server is running** on port 8080
- ✅ **API endpoints are accessible**
- ✅ **Frontend server is starting**
- ❌ **Database connection failing** - PostgreSQL not running

## The Problem

The debug logs show:
```
Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
```

## Solutions

### Option 1: Use a Cloud Database (Easiest - No Installation Required)

**Use Supabase (Free Tier):**
1. Go to https://supabase.com
2. Create a free account
3. Create a new project
4. Go to Settings → Database
5. Copy the "Connection string" (URI format)
6. Update `server/.env`:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
7. Restart the backend server

**Or use Neon (Free Tier):**
1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Update `server/.env` with the connection string
6. Restart the backend server

### Option 2: Install and Start Local PostgreSQL

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install it (remember the password you set for the `postgres` user)
3. Start PostgreSQL service:
   ```powershell
   # Check if service is running
   Get-Service postgresql*
   
   # Start the service if it exists
   Start-Service postgresql*
   ```
4. Create the database:
   ```powershell
   psql -U postgres
   # Then in psql:
   CREATE DATABASE contractorv3;
   \q
   ```
5. Update `server/.env`:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/contractorv3"
   ```
6. Restart the backend server

### Option 3: Run Without Database (Limited Features)

The server is already running without database connection. You can:
- Test frontend UI
- Test API endpoints that don't require database
- But: Login, registration, and data features won't work

## Quick Test

After setting up the database, restart the backend and check:

```powershell
# Test database connection
Invoke-WebRequest http://localhost:8080/api/health | ConvertFrom-Json
```

You should see `"database": "connected"` instead of `"disconnected"`.

## Next Steps

1. Choose one of the options above
2. Update `server/.env` with the correct DATABASE_URL
3. Restart the backend server (stop and start again)
4. Check `.cursor/debug.log` to verify connection succeeds

