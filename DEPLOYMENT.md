# Production Deployment Guide

This guide covers deploying the Contractor CRM application to production:
- **Frontend**: Firebase Hosting
- **Backend**: Google Cloud Run (already deployed)

## Prerequisites

1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Firebase project created**: Visit [Firebase Console](https://console.firebase.google.com/)
3. **Backend deployed**: Your backend should already be running on Cloud Run
4. **Google Cloud SDK installed** (for CORS configuration): [Install Guide](https://cloud.google.com/sdk/docs/install)

## Important Note: TypeScript Errors

**Before building for production**, ensure all TypeScript errors are resolved. The build script runs `tsc && vite build`, which will fail if there are TypeScript errors.

If you encounter TypeScript errors during build:
1. Fix the errors (recommended for production)
2. Or temporarily modify `package.json` build script to `vite build` (skips type checking - not recommended for production)

The deployment configuration in this guide is correct; any build failures are due to pre-existing code issues that need to be addressed separately.

## Environment Variables

### Frontend Build Variables

The frontend requires these environment variables at **build time** (not runtime):

- `VITE_API_URL`: Your Cloud Run backend URL (without `/api` suffix)
  - Example: `https://contractorv3-backend-123456.run.app`
  - The code automatically appends `/api` to this URL
- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key (optional but recommended)

### Backend Environment Variables

The backend requires these environment variables on Cloud Run:

- `CORS_ORIGIN`: Comma-separated list of allowed frontend origins
  - Example: `https://your-project-id.web.app,https://your-project-id.firebaseapp.com`
  - Or single origin: `https://yourdomain.com`
  - Defaults to `*` (allows all) if not set (not recommended for production)

## Step-by-Step Deployment

### Step 1: Configure Backend CORS

**CRITICAL**: Before deploying the frontend, configure CORS on your Cloud Run backend to allow requests from Firebase Hosting.

1. **Get your Firebase Hosting URLs**:
   - Default URLs: `https://your-project-id.web.app` and `https://your-project-id.firebaseapp.com`
   - Custom domain: Your custom domain URL (if configured)

2. **Update Cloud Run CORS_ORIGIN**:
   ```bash
   gcloud run services update contractorv3-backend \
     --region=us-central1 \
     --set-env-vars="CORS_ORIGIN=https://your-project-id.web.app,https://your-project-id.firebaseapp.com"
   ```

   Or if using a custom domain:
   ```bash
   gcloud run services update contractorv3-backend \
     --region=us-central1 \
     --set-env-vars="CORS_ORIGIN=https://yourdomain.com"
   ```

3. **Verify CORS is set**:
   ```bash
   gcloud run services describe contractorv3-backend \
     --region=us-central1 \
     --format="value(spec.template.spec.containers[0].env)"
   ```

### Step 2: Build the Frontend

Navigate to the client directory and build with production environment variables:

**Windows PowerShell:**
```powershell
cd client
$env:VITE_API_URL="https://your-backend-service-123456.run.app"
$env:VITE_GOOGLE_MAPS_API_KEY="your-maps-key-here"
npm run build
```

**Linux/Mac:**
```bash
cd client
export VITE_API_URL="https://your-backend-service-123456.run.app"
export VITE_GOOGLE_MAPS_API_KEY="your-maps-key-here"
npm run build
```

**Important Notes:**
- Replace `your-backend-service-123456.run.app` with your actual Cloud Run service URL
- Do NOT include `/api` in the URL - the code appends it automatically
- The build creates a `dist/` directory with production-ready static files
- If `VITE_API_URL` is not set, the build will use `/api` (relative path), which will fail in production

### Step 3: Initialize Firebase (First Time Only)

If you haven't initialized Firebase for this project:

```bash
cd client
firebase login
firebase init hosting
```

When prompted:
- Select "Use an existing project" or create a new one
- Set public directory to: `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (we'll build manually)
- Overwrite index.html: **No** (we already have one)

This creates/updates `firebase.json` (already configured in this project).

### Step 4: Deploy to Firebase Hosting

```bash
cd client
firebase deploy --only hosting
```

After deployment, Firebase will provide your hosting URL:
- Default: `https://your-project-id.web.app`
- Also available: `https://your-project-id.firebaseapp.com`

### Step 5: Verify Deployment

1. **Visit your Firebase Hosting URL**: `https://your-project-id.web.app`
2. **Test Login**: Verify authentication works end-to-end
3. **Check API Calls**: 
   - Open browser DevTools → Network tab
   - Verify API calls go to your Cloud Run backend (not `/api` relative paths)
   - Check that requests include `Authorization: Bearer <token>` headers
4. **Test Token Refresh**: 
   - Login, wait for token to expire (or manually expire it)
   - Make an API call - it should automatically refresh the token
5. **Check Console**: Ensure no CORS errors or API connection failures
6. **Test SPA Routing**: Navigate to different pages and refresh - should work correctly

## Troubleshooting

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: 
1. Verify `CORS_ORIGIN` is set on Cloud Run with your Firebase Hosting URL
2. Check that the URL matches exactly (including `https://`)
3. If using multiple origins, ensure they're comma-separated with no spaces (or with spaces that are trimmed)

```bash
# Check current CORS setting
gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep CORS_ORIGIN
```

### Issue: API calls go to `/api/...` instead of Cloud Run

**Symptoms**: Network tab shows requests to `https://your-app.web.app/api/...` instead of `https://your-backend.run.app/api/...`

**Solution**: 
1. `VITE_API_URL` was not set during build, or was set incorrectly
2. Rebuild with the correct environment variable:
   ```bash
   cd client
   $env:VITE_API_URL="https://your-backend-service-123456.run.app"  # Windows
   # or
   export VITE_API_URL="https://your-backend-service-123456.run.app"  # Linux/Mac
   npm run build
   ```
3. Redeploy: `firebase deploy --only hosting`

### Issue: "404 Not Found" on page refresh

**Solution**: Verify `firebase.json` has the SPA rewrite rule (should already be configured):
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Issue: Login fails or tokens don't persist

**Solution**:
1. Check that `CORS_ORIGIN` includes your Firebase Hosting URL
2. Verify `credentials: true` is set in CORS (already configured in backend)
3. Check browser console for CORS errors
4. Verify API calls are going to the correct backend URL

### Issue: Maps autocomplete doesn't work

**Solution**: 
1. Verify `VITE_GOOGLE_MAPS_API_KEY` was set during build
2. Check Google Cloud Console that the API key allows your Firebase Hosting domain
3. The app should degrade gracefully (manual address input still works)
4. Rebuild with the Maps key if it was missing:
   ```bash
   cd client
   $env:VITE_GOOGLE_MAPS_API_KEY="your-maps-key"  # Windows
   npm run build
   firebase deploy --only hosting
   ```

## Continuous Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Firebase

on:
  push:
    branches: [main]
    paths:
      - 'client/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd client && npm ci
      
      - name: Build frontend
        run: cd client && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

**Required GitHub Secrets:**
- `VITE_API_URL`: Your Cloud Run backend URL
- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (download from Firebase Console)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

### Google Cloud Build Example

The project includes `client/cloudbuild.frontend.yaml` for Cloud Build. Update the substitutions:

```yaml
substitutions:
  _BUCKET_NAME: 'contractorv3-frontend'
  _BACKEND_URL: 'https://your-backend-service.run.app'  # Without /api suffix
```

Then trigger the build:
```bash
gcloud builds submit --config=client/cloudbuild.frontend.yaml
```

## Production Checklist

Before going live, verify:

- [ ] Backend deployed to Cloud Run and accessible
- [ ] `CORS_ORIGIN` set on Cloud Run to Firebase Hosting URL(s)
- [ ] `VITE_API_URL` set to Cloud Run service URL (without `/api` suffix)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` set (optional but recommended)
- [ ] Frontend build completed successfully (`npm run build`)
- [ ] Firebase project initialized (`firebase init hosting`)
- [ ] Deployment successful (`firebase deploy --only hosting`)
- [ ] Login flow works in production
- [ ] API calls succeed (check Network tab - should go to Cloud Run)
- [ ] No CORS errors in browser console
- [ ] Page refresh works (SPA routing)
- [ ] Token refresh works (login, wait, make API call)
- [ ] Logout → login again works
- [ ] Maps autocomplete works (if key provided)

## Architecture Overview

```
┌─────────────────────┐
│  Firebase Hosting   │  (Frontend SPA)
│  your-app.web.app   │
└──────────┬──────────┘
           │ HTTPS
           │ API Calls
           ▼
┌─────────────────────┐
│   Google Cloud Run  │  (Backend API)
│  backend.run.app    │
│       /api/*        │
└─────────────────────┘
```

**Key Points:**
- Frontend is a static SPA served by Firebase Hosting
- All API calls go directly from browser to Cloud Run (no proxy in production)
- CORS must be configured to allow Firebase Hosting → Cloud Run requests
- Environment variables are baked into the build (not runtime)

## Security Notes

1. **CORS**: Never use `CORS_ORIGIN=*` in production. Always specify exact origins.
2. **API Keys**: Google Maps API key should be restricted to your Firebase Hosting domains in Google Cloud Console.
3. **Secrets**: Backend secrets (JWT_SECRET, DATABASE_URL, etc.) are stored in Google Secret Manager and injected into Cloud Run.
4. **HTTPS**: Both Firebase Hosting and Cloud Run enforce HTTPS in production.

## Support

For issues or questions:
1. Check browser console for errors
2. Check Cloud Run logs: `gcloud run services logs read contractorv3-backend --region=us-central1`
3. Check Firebase Hosting logs in Firebase Console
4. Verify environment variables are set correctly

