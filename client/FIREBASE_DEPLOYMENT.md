# Firebase Hosting Deployment Guide

This guide covers deploying the Contractor CRM frontend to Firebase Hosting with a backend on Google Cloud Run.

## Prerequisites

1. **Firebase CLI installed**: `npm install -g firebase-tools`
2. **Firebase project created**: Visit [Firebase Console](https://console.firebase.google.com/)
3. **Backend deployed**: Your backend should already be running on Cloud Run
4. **Backend CORS configured**: Ensure `CORS_ORIGIN` environment variable is set on Cloud Run

## Environment Variables

### For Local Development

Create `client/.env.local`:
```env
# Leave VITE_API_URL empty to use Vite proxy (http://localhost:8080)
VITE_API_URL=
VITE_GOOGLE_MAPS_API_KEY=your-maps-key-here
```

### For Production Build

Set these environment variables **before** running `npm run build`:

**Option 1: Environment file (for CI/CD)**
```env
VITE_API_URL=https://your-backend-service-123456.run.app
VITE_GOOGLE_MAPS_API_KEY=your-maps-key-here
```

**Option 2: Inline (for manual builds)**
```bash
# Windows PowerShell
$env:VITE_API_URL="https://your-backend-service-123456.run.app"
$env:VITE_GOOGLE_MAPS_API_KEY="your-maps-key-here"
npm run build

# Linux/Mac
export VITE_API_URL="https://your-backend-service-123456.run.app"
export VITE_GOOGLE_MAPS_API_KEY="your-maps-key-here"
npm run build
```

**Important Notes:**
- `VITE_API_URL` should be your Cloud Run service URL (e.g., `https://contractorv3-backend-123456.run.app`)
- The `/api` suffix is automatically appended by the code, so don't include it
- If `VITE_API_URL` is not set, the build will use `/api` (relative path), which will fail in production

## Backend CORS Configuration

**CRITICAL**: Before deploying, ensure your Cloud Run backend allows requests from your Firebase Hosting domain.

1. Get your Firebase Hosting URL:
   - Default: `https://your-project-id.web.app` or `https://your-project-id.firebaseapp.com`
   - Custom domain: Your custom domain URL

2. Update Cloud Run CORS_ORIGIN:
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

## Build and Deploy Steps

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Set Production Environment Variables
```bash
# Windows PowerShell
$env:VITE_API_URL="https://your-backend-service-123456.run.app"
$env:VITE_GOOGLE_MAPS_API_KEY="your-maps-key-here"

# Linux/Mac
export VITE_API_URL="https://your-backend-service-123456.run.app"
export VITE_GOOGLE_MAPS_API_KEY="your-maps-key-here"
```

### Step 3: Build the Frontend
```bash
npm run build
```

This creates a `dist/` directory with production-ready static files.

### Step 4: Initialize Firebase (First Time Only)
```bash
firebase login
firebase init hosting
```

When prompted:
- Select "Use an existing project" or create a new one
- Set public directory to: `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (we'll build manually)
- Overwrite index.html: **No** (we already have one)

### Step 5: Deploy to Firebase
```bash
firebase deploy --only hosting
```

## Verification

After deployment:

1. **Check Firebase Hosting URL**: Visit `https://your-project-id.web.app`
2. **Test Login**: Verify authentication works
3. **Test API Calls**: Open browser DevTools → Network tab, verify API calls go to Cloud Run backend
4. **Check Console**: Ensure no CORS errors or API connection failures

## Troubleshooting

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution**: Update `CORS_ORIGIN` on Cloud Run to include your Firebase Hosting URL (see Backend CORS Configuration above)

### Issue: API calls go to `/api/...` instead of Cloud Run
**Solution**: Ensure `VITE_API_URL` is set before building. Rebuild with the correct environment variable.

### Issue: "404 Not Found" on page refresh
**Solution**: Verify `firebase.json` has the SPA rewrite rule (should already be configured)

### Issue: Maps autocomplete doesn't work
**Solution**: 
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set in build environment
- Check Google Cloud Console that the API key allows your Firebase Hosting domain
- The app should degrade gracefully (manual address input still works)

## Continuous Deployment (Optional)

To set up automatic deployments on push:

1. Install Firebase GitHub Action or use Firebase CLI in your CI/CD pipeline
2. Set environment variables as GitHub Secrets or CI/CD environment variables
3. Build and deploy on every push to `main` branch

Example GitHub Actions workflow:
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd client && npm ci
      - run: cd client && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

## Production Checklist

- [ ] Backend deployed to Cloud Run
- [ ] `CORS_ORIGIN` set on Cloud Run to Firebase Hosting URL
- [ ] `VITE_API_URL` set to Cloud Run service URL (without `/api` suffix)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` set (optional but recommended)
- [ ] Build completed successfully (`npm run build`)
- [ ] Firebase project initialized (`firebase init hosting`)
- [ ] Deployment successful (`firebase deploy --only hosting`)
- [ ] Login flow works in production
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in console
- [ ] Page refresh works (SPA routing)

