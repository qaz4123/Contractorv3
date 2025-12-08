# ContractorCRM - Troubleshooting Guide

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Database Connection Problems](#database-connection-problems)
3. [API Errors](#api-errors)
4. [Frontend Issues](#frontend-issues)
5. [Deployment Issues](#deployment-issues)
6. [Performance Problems](#performance-problems)
7. [Development Environment Issues](#development-environment-issues)

---

## Authentication Issues

### Problem: "Cannot login - Invalid credentials"

**Symptoms:**
- Login fails with "Invalid email or password"
- Correct credentials are being used

**Possible Causes & Solutions:**

1. **Database connection issue**
   ```bash
   # Check database connection
   cd server
   npm run db:studio
   ```
   - If Prisma Studio doesn't open, check DATABASE_URL in .env

2. **Demo user not created**
   ```bash
   # Seed demo data
   cd server
   npm run db:seed
   ```

3. **Password mismatch**
   - Demo password is: `Demo123!`
   - Password is case-sensitive
   - Ensure no extra spaces

4. **Rate limiting**
   - Wait 15 minutes after multiple failed attempts
   - Clear browser cookies and try again

---

### Problem: "Token verification failed"

**Symptoms:**
- Logged out immediately after login
- Console shows "Token verification failed"
- Constant redirects to login page

**Possible Causes & Solutions:**

1. **JWT_SECRET mismatch**
   ```bash
   # Check server .env file
   cat server/.env | grep JWT_SECRET
   ```
   - Must be at least 32 characters
   - Must be the same across all server instances

2. **Token expired**
   - Normal if not logged in for 24+ hours
   - Just login again

3. **Server restart**
   - Refresh tokens are stored in database
   - Access tokens are stateless but validated
   - Clear localStorage and login again:
   ```javascript
   localStorage.clear();
   window.location.reload();
   ```

4. **Clock skew**
   - Ensure server and client clocks are synchronized
   - Check system time settings

---

### Problem: "401 Unauthorized on all protected routes"

**Symptoms:**
- All API calls return 401
- Already logged in successfully
- Token appears in localStorage

**Possible Causes & Solutions:**

1. **Token not being sent**
   - Open browser DevTools → Network tab
   - Check request headers for `Authorization: Bearer <token>`
   - If missing, check axios interceptor in `client/src/services/api.ts`

2. **Malformed Authorization header**
   ```javascript
   // Correct format
   headers: {
     'Authorization': 'Bearer eyJhbGc...'
   }
   
   // Wrong format (missing 'Bearer')
   headers: {
     'Authorization': 'eyJhbGc...'
   }
   ```

3. **Token stored incorrectly**
   ```javascript
   // Check localStorage
   console.log(localStorage.getItem('auth-storage'));
   ```

4. **Backend auth middleware not working**
   - Check server logs for errors
   - Verify JWT_SECRET is set
   - Test with: `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/auth/me`

---

## Database Connection Problems

### Problem: "Can't reach database server"

**Symptoms:**
- Error: "P1001: Can't reach database server"
- Server won't start
- All API calls fail

**Solutions:**

1. **Check DATABASE_URL format**
   ```bash
   # Correct format for local PostgreSQL
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   
   # Correct format for Cloud SQL
   DATABASE_URL="postgresql://username:password@/database_name?host=/cloudsql/project:region:instance"
   ```

2. **Verify PostgreSQL is running**
   ```bash
   # Check if PostgreSQL is running (Linux/Mac)
   pg_isready
   
   # Start PostgreSQL (Linux)
   sudo systemctl start postgresql
   
   # Start PostgreSQL (Mac with Homebrew)
   brew services start postgresql
   ```

3. **Check credentials**
   ```bash
   # Test connection manually
   psql -h localhost -U username -d database_name
   ```

4. **Firewall issues**
   - Ensure port 5432 is open
   - Check firewall rules
   - For Cloud SQL, ensure Cloud SQL Auth Proxy is running

---

### Problem: "Migration / Schema Issues"

**Symptoms:**
- Error: "Table doesn't exist"
- Error: "Column not found"
- Schema drift warnings

**Solutions:**

1. **Reset database (DANGER: deletes all data)**
   ```bash
   cd server
   npm run db:push -- --force-reset
   npm run db:seed
   ```

2. **Generate Prisma Client**
   ```bash
   cd server
   npm run db:generate
   ```

3. **Check schema file**
   - Ensure `server/prisma/schema.prisma` is correct
   - Run `npx prisma validate` to check for errors

---

## API Errors

### Problem: "CORS Error"

**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Requests fail in browser but work in Postman

**Solutions:**

1. **Development (localhost)**
   - Frontend should use proxy (already configured in `vite.config.ts`)
   - Set `VITE_API_URL=/api` in client/.env
   - Requests go to `http://localhost:3000/api` and proxy to `http://localhost:8080`

2. **Production**
   ```bash
   # Update server/.env
   CORS_ORIGIN=https://your-frontend-domain.com
   ```
   - Don't use `*` in production
   - Can specify multiple origins: `https://app.com,https://www.app.com`

3. **Cloud Run**
   - Update environment variable in Cloud Run console
   - Or update in `cloudbuild.yaml`:
   ```yaml
   --set-env-vars=CORS_ORIGIN=https://your-frontend.com
   ```

---

### Problem: "500 Internal Server Error"

**Symptoms:**
- API returns 500 error
- No specific error message
- Server logs show error stack trace

**Solutions:**

1. **Check server logs**
   ```bash
   # Local development
   # Check terminal where `npm run dev` is running
   
   # Cloud Run
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=backend" --limit 50
   ```

2. **Common causes:**
   - Database query errors (check Prisma logs)
   - Missing environment variables
   - Uncaught exceptions
   - Memory issues (increase Cloud Run memory limit)

3. **Enable verbose logging**
   ```javascript
   // Add to server/src/index.ts
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.path}`, req.body);
     next();
   });
   ```

---

### Problem: "Request Timeout"

**Symptoms:**
- Request takes >30 seconds
- Error: "Request timeout"
- Slow API responses

**Solutions:**

1. **Increase timeout (client)**
   ```javascript
   // client/src/services/api.ts
   const api = axios.create({
     timeout: 60000, // 60 seconds
   });
   ```

2. **Increase timeout (Cloud Run)**
   ```yaml
   # cloudbuild.yaml
   --timeout=300  # 5 minutes (max)
   ```

3. **Optimize database queries**
   - Add indexes to frequently queried fields
   - Use `select` to limit returned fields
   - Implement pagination for large datasets

4. **Check for cold starts**
   - Set minimum instances in Cloud Run: `--min-instances=1`
   - Cold starts can take 5-10 seconds

---

## Frontend Issues

### Problem: "Page Not Found (404)"

**Symptoms:**
- Clicking links results in 404
- Direct navigation to route fails
- Refresh on route shows 404

**Solutions:**

1. **Development**
   - Should work out of the box with Vite
   - Check `vite.config.ts` has correct configuration

2. **Production (Cloud Run)**
   - Ensure SPA fallback is configured in `server/src/index.ts`
   ```javascript
   app.get('*', (req, res, next) => {
     if (req.path.startsWith('/api')) {
       return next();
     }
     res.sendFile('index.html', { root: staticPath });
   });
   ```

3. **Check React Router**
   - Verify routes are defined in `client/src/App.tsx`
   - Ensure using `BrowserRouter` (not `HashRouter`)

---

### Problem: "White Screen / Blank Page"

**Symptoms:**
- App loads but shows blank page
- No errors in console
- Or errors about "Cannot read property of undefined"

**Solutions:**

1. **Check browser console**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Common: missing environment variables

2. **Check VITE_ environment variables**
   ```bash
   # client/.env must have VITE_ prefix
   VITE_API_URL=/api
   # NOT: API_URL=/api
   ```

3. **Clear browser cache**
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

4. **Check build output**
   ```bash
   cd client
   npm run build
   # Check for errors
   ```

---

### Problem: "API calls failing from frontend"

**Symptoms:**
- Network tab shows failed requests
- "Failed to fetch" errors
- CORS or 404 errors

**Solutions:**

1. **Check API_URL configuration**
   ```bash
   # Development (client/.env)
   VITE_API_URL=/api
   
   # Production (client/.env)
   VITE_API_URL=https://your-backend.run.app/api
   ```

2. **Verify proxy in development**
   ```javascript
   // vite.config.ts should have:
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8080',
         changeOrigin: true,
       },
     },
   }
   ```

3. **Check backend is running**
   ```bash
   curl http://localhost:8080/health
   # Should return: {"status":"healthy"}
   ```

---

## Deployment Issues

### Problem: "Cloud Run build failing"

**Symptoms:**
- Cloud Build shows errors
- Deployment doesn't complete
- Container fails to start

**Solutions:**

1. **Check build logs**
   ```bash
   gcloud builds list --limit=5
   gcloud builds log <BUILD_ID>
   ```

2. **Common issues:**
   - **Missing files**: Ensure .dockerignore doesn't exclude needed files
   - **Build timeout**: Increase timeout in `cloudbuild.yaml`
   - **Memory issues**: Use larger machine type
   ```yaml
   options:
     machineType: 'E2_HIGHCPU_8'
   ```

3. **Test build locally**
   ```bash
   docker build -t test-image .
   docker run -p 8080:8080 test-image
   ```

---

### Problem: "Environment variables not loading in Cloud Run"

**Symptoms:**
- App works locally but not on Cloud Run
- Errors about missing configuration
- JWT_SECRET or API keys not found

**Solutions:**

1. **Check Cloud Run environment variables**
   ```bash
   gcloud run services describe backend --region=us-central1
   ```

2. **Use Secret Manager for sensitive values**
   ```bash
   # Create secret
   echo "my-secret-value" | gcloud secrets create JWT_SECRET --data-file=-
   
   # Grant access to Cloud Run service account
   gcloud secrets add-iam-policy-binding JWT_SECRET \
     --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   ```

3. **Update cloudbuild.yaml**
   ```yaml
   --set-secrets=JWT_SECRET=JWT_SECRET:latest
   ```

---

### Problem: "Cloud SQL connection failing"

**Symptoms:**
- Database connection errors in Cloud Run
- "Can't reach database server"
- Timeouts

**Solutions:**

1. **Check Cloud SQL instance is running**
   ```bash
   gcloud sql instances describe INSTANCE_NAME
   ```

2. **Verify connection name**
   ```yaml
   # cloudbuild.yaml
   --add-cloudsql-instances=PROJECT_ID:REGION:INSTANCE_NAME
   ```

3. **Check DATABASE_URL format for Cloud SQL**
   ```bash
   # Use Unix socket
   DATABASE_URL="postgresql://user:password@/database?host=/cloudsql/project:region:instance"
   ```

4. **Ensure Cloud Run service account has permissions**
   ```bash
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member=serviceAccount:SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com \
     --role=roles/cloudsql.client
   ```

---

## Performance Problems

### Problem: "Slow initial page load"

**Symptoms:**
- First page load takes >3 seconds
- Lighthouse performance score is low

**Solutions:**

1. **Optimize bundle size**
   ```bash
   cd client
   npm run build
   # Check dist/assets/ file sizes
   ```

2. **Implement code splitting**
   - Already done for heavy pages in `App.tsx`
   - Add more lazy loading if needed

3. **Enable caching**
   - Set cache headers for static assets
   - Use CDN for static files

4. **Optimize images**
   - Compress images
   - Use modern formats (WebP)
   - Implement lazy loading

---

### Problem: "Slow API responses"

**Symptoms:**
- API calls take >2 seconds
- List pages are slow to load

**Solutions:**

1. **Add database indexes**
   ```prisma
   // prisma/schema.prisma
   model Lead {
     // ...
     @@index([userId, status])
     @@index([leadScore])
   }
   ```

2. **Implement caching**
   - Use Redis or MemoryStore for frequently accessed data
   - Cache AI analysis results

3. **Optimize queries**
   ```javascript
   // Use select to limit fields
   const leads = await prisma.lead.findMany({
     select: {
       id: true,
       name: true,
       status: true,
       leadScore: true,
     },
   });
   ```

4. **Implement pagination**
   - Don't load all records at once
   - Use `skip` and `take` in Prisma

---

## Development Environment Issues

### Problem: "npm install fails"

**Symptoms:**
- Error during `npm install`
- Missing dependencies
- Version conflicts

**Solutions:**

1. **Clear npm cache**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use correct Node version**
   ```bash
   node --version  # Should be 18.x or 20.x
   nvm use 20  # If using nvm
   ```

3. **Check for firewall/proxy issues**
   - Some networks block npm registry
   - Try using a VPN

---

### Problem: "TypeScript compilation errors"

**Symptoms:**
- `npm run build` fails
- TypeScript errors in IDE
- Import errors

**Solutions:**

1. **Regenerate Prisma Client**
   ```bash
   cd server
   npm run db:generate
   ```

2. **Check tsconfig.json**
   - Ensure correct paths
   - Verify include/exclude settings

3. **Clear TypeScript cache**
   ```bash
   rm -rf node_modules/.cache
   npm run build
   ```

---

### Problem: "Hot reload not working"

**Symptoms:**
- Changes don't appear after saving
- Need to manually refresh
- Server doesn't restart

**Solutions:**

1. **Backend (tsx watch)**
   - Check if using `npm run dev`
   - Try restarting the dev server

2. **Frontend (Vite)**
   - Should work automatically
   - Check if saving files in correct directory
   - Try restarting Vite server

3. **IDE issues**
   - Disable "Safe Write" in IDE settings
   - Check file permissions

---

## Getting Help

### Before Asking for Help

1. **Check logs**
   - Browser console (F12)
   - Server terminal output
   - Cloud Logging (for production)

2. **Get correlation ID**
   - Check `X-Correlation-ID` header in network tab
   - Include this in support requests

3. **Reproduce the issue**
   - List exact steps to reproduce
   - Note browser, OS, environment

4. **Gather information**
   ```bash
   # Node version
   node --version
   
   # npm version
   npm --version
   
   # Check if database is reachable
   psql DATABASE_URL
   
   # Check if server is running
   curl http://localhost:8080/health
   ```

### How to Report an Issue

Include the following information:

1. **Environment**
   - Development or Production
   - Node version
   - OS version

2. **Steps to reproduce**
   - Exact steps to trigger the issue
   - Expected vs actual behavior

3. **Logs and errors**
   - Complete error message
   - Stack trace
   - Correlation ID
   - Relevant log entries

4. **Screenshots**
   - Browser console
   - Network tab
   - UI screenshots

### Emergency Rollback

If production is broken:

```bash
# Rollback to previous Cloud Run revision
gcloud run services update-traffic backend \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1

# Or rollback to previous tag
gcloud run deploy backend \
  --image=gcr.io/PROJECT_ID/contractor-crm-v2:PREVIOUS_TAG \
  --region=us-central1
```

---

## Useful Commands

### Development

```bash
# Start everything
cd /path/to/Contractorv3
npm run install:all  # Install dependencies
npm run dev  # Start backend
npm run dev:client  # Start frontend (in separate terminal)

# Reset database
cd server
npm run db:push -- --force-reset
npm run db:seed

# View database
cd server
npm run db:studio
```

### Production

```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit=100

# Check service status
gcloud run services describe backend --region=us-central1

# Update environment variable
gcloud run services update backend \
  --update-env-vars=KEY=VALUE \
  --region=us-central1

# Check secrets
gcloud secrets list
gcloud secrets versions access latest --secret=JWT_SECRET
```

### Database

```bash
# Connect to database
psql $DATABASE_URL

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql

# Check database size
psql $DATABASE_URL -c "SELECT pg_database_size(current_database());"
```

---

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **React Router Docs**: https://reactrouter.com
- **Vite Docs**: https://vitejs.dev

---

**Last Updated**: January 2024
