# Local Development Setup Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies  
cd ../client
npm install
```

### 2. Set Up Database

**Option A: Use Local PostgreSQL (Recommended for Development)**

1. Install PostgreSQL if not already installed
2. Create a database:
   ```bash
   createdb contractorv3
   # Or using psql:
   psql -c "CREATE DATABASE contractorv3;"
   ```
3. Create `.env` file in `server/` directory:
   ```bash
   cd server
   cp .env.example .env
   ```
4. Edit `server/.env` and add:
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/contractorv3"
   JWT_SECRET="your-random-secret-key-at-least-32-characters-long"
   ```

**Option B: Use Cloud Database (Supabase, Neon, etc.)**

1. Create a free PostgreSQL database on Supabase or Neon
2. Copy the connection string
3. Create `server/.env`:
   ```
   DATABASE_URL="your-cloud-database-connection-string"
   JWT_SECRET="your-random-secret-key-at-least-32-characters-long"
   ```

**Option C: Run Without Database (Limited Functionality)**

The server will start but database features won't work. Good for testing frontend-only.

### 3. Initialize Database Schema

```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Should see: `🚀 Server running on port 8080`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Should see: `Local: http://localhost:3000`

### 5. Test the Application

1. Open `http://localhost:3000`
2. Register a new account or use demo credentials:
   - Email: `demo@contractorcrm.com`
   - Password: `Demo123!`
3. Navigate to different pages to test

## Troubleshooting

### "Connection failed" Error

**If backend won't start:**
- Check if port 8080 is already in use
- Verify `.env` file exists in `server/` directory
- Check DATABASE_URL format is correct
- Look at backend console for specific error messages

**If frontend can't connect to backend:**
- Verify backend is running on port 8080
- Check browser console for CORS errors
- Verify Vite proxy is configured (should be automatic)

**If database connection fails:**
- Verify PostgreSQL is running: `pg_isready` or check service status
- Test connection: `psql $DATABASE_URL`
- Check DATABASE_URL format matches: `postgresql://user:pass@host:port/dbname`
- For Cloud SQL, verify network access and connection string format

### Generate JWT Secret

```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Check Logs

After running the app, check `.cursor/debug.log` for detailed connection information.

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes* | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `JWT_SECRET` | Yes* | Secret for JWT tokens (32+ chars) | Generated with openssl |
| `PORT` | No | Backend port (default: 8080) | `8080` |
| `NODE_ENV` | No | Environment (default: development) | `development` |
| `TAVILY_API_KEY` | No | For property search features | Your Tavily API key |
| `GEMINI_API_KEY` | No | For AI analysis features | Your Gemini API key |
| `MAPS_API_KEY` | No | For Google Maps features | Your Maps API key |

*Required in production, optional in development (with limited functionality)

