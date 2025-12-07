# Separated Frontend & Backend Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │   Cloud Storage      │      │     Cloud Run        │    │
│  │   (Frontend)         │◄────►│     (Backend API)    │    │
│  │                      │      │                      │    │
│  │  - React SPA         │      │  - Express Server    │    │
│  │  - Static Assets     │      │  - Business Logic    │    │
│  └──────────────────────┘      └──────────────────────┘    │
│           │                              │                   │
│           │ (optional)                   │                   │
│  ┌────────▼──────────┐         ┌────────▼──────────┐       │
│  │   Cloud CDN       │         │   Cloud SQL        │       │
│  │ (Global Caching)  │         │   (PostgreSQL)     │       │
│  └───────────────────┘         └────────────────────┘       │
│                                          │                   │
│                                 ┌────────▼──────────┐       │
│                                 │  Secret Manager    │       │
│                                 │  (API Keys, etc.)  │       │
│                                 └────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. Google Cloud Project with billing enabled
2. Required APIs enabled:
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     sqladmin.googleapis.com \
     storage.googleapis.com \
     secretmanager.googleapis.com
   ```

3. Create secrets in Secret Manager:
   ```bash
   # Database URL
   echo -n "postgresql://user:pass@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE" | \
     gcloud secrets create DATABASE_URL --data-file=-
   
   # JWT Secret
   echo -n "$(openssl rand -base64 32)" | \
     gcloud secrets create JWT_SECRET --data-file=-
   
   # API Keys
   echo -n "your-gemini-api-key" | \
     gcloud secrets create GEMINI_API_KEY --data-file=-
   
   echo -n "your-tavily-api-key" | \
     gcloud secrets create TAVILY_API_KEY --data-file=-
   
   echo -n "your-google-maps-api-key" | \
     gcloud secrets create MAPS_API_KEY --data-file=-
   ```

## Part 1: Deploy Backend to Cloud Run

### Step 1: Create Cloud SQL Instance (if not exists)

```bash
gcloud sql instances create contractorv3-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --storage-size=10GB
```

### Step 2: Create Database

```bash
gcloud sql databases create contractorv3 \
  --instance=contractorv3-db
```

### Step 3: Build and Deploy Backend

```bash
# Navigate to server directory
cd server

# Build backend Docker image
gcloud builds submit \
  --tag gcr.io/YOUR_PROJECT_ID/contractorv3-backend:latest \
  .

# Deploy to Cloud Run
gcloud run deploy contractorv3-backend \
  --image gcr.io/YOUR_PROJECT_ID/contractorv3-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:contractorv3-db \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,\
JWT_SECRET=JWT_SECRET:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
TAVILY_API_KEY=TAVILY_API_KEY:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,PORT=8080,CORS_ORIGIN=*"
```

### Step 4: Get Backend URL

```bash
BACKEND_URL=$(gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --format='value(status.url)')

echo "Backend URL: $BACKEND_URL"
```

## Part 2: Deploy Frontend to Cloud Storage

### Step 1: Create Storage Bucket

```bash
# Create bucket (must be globally unique)
gsutil mb -l us-central1 gs://contractorv3-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://contractorv3-frontend

# Configure for website
gsutil web set -m index.html -e index.html gs://contractorv3-frontend
```

### Step 2: Build Frontend with Backend URL

```bash
cd client

# Set backend URL as environment variable
export VITE_API_URL=$BACKEND_URL

# Build frontend
npm run build

# Upload to Cloud Storage
gsutil -m rsync -r -d dist/ gs://contractorv3-frontend/
```

### Step 3: (Optional) Enable Cloud CDN

```bash
# Create backend bucket
gcloud compute backend-buckets create contractorv3-frontend-backend \
  --gcs-bucket-name=contractorv3-frontend \
  --enable-cdn

# Create URL map
gcloud compute url-maps create contractorv3-frontend-urlmap \
  --default-backend-bucket=contractorv3-frontend-backend

# Create HTTP proxy
gcloud compute target-http-proxies create contractorv3-frontend-proxy \
  --url-map=contractorv3-frontend-urlmap

# Create forwarding rule (gets external IP)
gcloud compute forwarding-rules create contractorv3-frontend-rule \
  --global \
  --target-http-proxy=contractorv3-frontend-proxy \
  --ports=80
```

### Step 4: Get Frontend URL

```bash
# Without CDN (direct bucket access)
echo "Frontend URL: https://storage.googleapis.com/contractorv3-frontend/index.html"

# With CDN (if configured)
FRONTEND_IP=$(gcloud compute forwarding-rules describe contractorv3-frontend-rule \
  --global \
  --format='value(IPAddress)')
echo "Frontend URL: http://$FRONTEND_IP"
```

## Part 3: Configure CORS on Backend

Update backend CORS to allow frontend origin:

```bash
# If using custom domain
gcloud run services update contractorv3-backend \
  --region us-central1 \
  --set-env-vars "CORS_ORIGIN=https://yourdomain.com"

# For storage bucket
gcloud run services update contractorv3-backend \
  --region us-central1 \
  --set-env-vars "CORS_ORIGIN=https://storage.googleapis.com"
```

## Part 4: Automated Deployment with Cloud Build

### Backend CI/CD Pipeline

Create `server/cloudbuild.yaml`:

```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/contractorv3-backend:$SHORT_SHA', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/contractorv3-backend:$SHORT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'contractorv3-backend'
      - '--image=gcr.io/$PROJECT_ID/contractorv3-backend:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'

images:
  - 'gcr.io/$PROJECT_ID/contractorv3-backend:$SHORT_SHA'
```

### Frontend CI/CD Pipeline

Create `client/cloudbuild.yaml`:

```yaml
steps:
  # Install dependencies
  - name: 'node:20'
    entrypoint: npm
    args: ['install']
    dir: 'client'
  
  # Build frontend
  - name: 'node:20'
    entrypoint: npm
    args: ['run', 'build']
    dir: 'client'
    env:
      - 'VITE_API_URL=${_BACKEND_URL}'
  
  # Deploy to Cloud Storage
  - name: 'gcr.io/cloud-builders/gsutil'
    args: ['-m', 'rsync', '-r', '-d', 'client/dist/', 'gs://contractorv3-frontend/']

substitutions:
  _BACKEND_URL: 'https://contractorv3-backend-xxx.run.app'
```

### Set Up Cloud Build Triggers

```bash
# Backend trigger
gcloud builds triggers create github \
  --repo-name=Contractorv3 \
  --repo-owner=qaz4123 \
  --branch-pattern="^main$" \
  --build-config=server/cloudbuild.yaml \
  --included-files="server/**" \
  --name=backend-deploy

# Frontend trigger
gcloud builds triggers create github \
  --repo-name=Contractorv3 \
  --repo-owner=qaz4123 \
  --branch-pattern="^main$" \
  --build-config=client/cloudbuild.yaml \
  --included-files="client/**" \
  --name=frontend-deploy
```

## Cost Estimation

### Backend (Cloud Run)
- **Idle**: $0/month (scales to zero)
- **Active**: ~$5-20/month for small-medium traffic
- Charged per request and compute time

### Frontend (Cloud Storage)
- **Storage**: ~$0.02/month for 1GB
- **Network**: $0.12/GB (first 1TB)
- **Operations**: ~$0.50/month

### Database (Cloud SQL)
- **db-f1-micro**: ~$7.67/month
- **10GB storage**: ~$1.70/month

### Total: ~$10-30/month for small-medium usage

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
GEMINI_API_KEY=...
TAVILY_API_KEY=...
NODE_ENV=production
PORT=8080
CORS_ORIGIN=https://storage.googleapis.com
```

### Frontend (.env)
```env
VITE_API_URL=https://contractorv3-backend-xxx.run.app
VITE_MAPS_API_KEY=... (for client-side Maps usage)
```

## Custom Domain Setup (Optional)

### For Backend API:
```bash
gcloud run domain-mappings create \
  --service contractorv3-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

### For Frontend:
```bash
gcloud compute backend-buckets create frontend-backend \
  --gcs-bucket-name=contractorv3-frontend

# Configure SSL certificate and load balancer
# See: https://cloud.google.com/storage/docs/hosting-static-website
```

## Monitoring & Logging

```bash
# View backend logs
gcloud run services logs read contractorv3-backend --region us-central1

# View frontend access logs
gsutil logging get gs://contractorv3-frontend

# Set up Cloud Monitoring alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Backend Error Rate" \
  --condition-display-name="High Error Rate" \
  --condition-threshold-value=0.05
```

## Rollback Procedures

### Backend Rollback:
```bash
# List revisions
gcloud run revisions list --service contractorv3-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic contractorv3-backend \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

### Frontend Rollback:
```bash
# Keep versioned backups
gsutil -m cp -r gs://contractorv3-frontend gs://contractorv3-frontend-backup-$(date +%Y%m%d)

# Restore from backup
gsutil -m rsync -r -d gs://contractorv3-frontend-backup-20251206/ gs://contractorv3-frontend/
```

## Security Best Practices

1. ✅ Use Secret Manager for all sensitive data
2. ✅ Enable VPC for Cloud SQL
3. ✅ Use service accounts with minimal permissions
4. ✅ Enable Cloud Armor for DDoS protection
5. ✅ Set up Cloud IAM properly
6. ✅ Use HTTPS everywhere
7. ✅ Implement rate limiting on backend
8. ✅ Regular security audits

## Troubleshooting

### Backend issues:
```bash
# Check logs
gcloud run services logs read contractorv3-backend --region us-central1 --limit 50

# Test endpoint
curl https://contractorv3-backend-xxx.run.app/api/health
```

### Frontend issues:
```bash
# Check if files exist
gsutil ls gs://contractorv3-frontend/

# Test direct access
curl https://storage.googleapis.com/contractorv3-frontend/index.html
```

### CORS issues:
- Ensure CORS_ORIGIN is set correctly on backend
- Check browser console for CORS errors
- Verify OPTIONS requests are allowed

## Next Steps

1. Set up custom domains
2. Configure SSL certificates
3. Enable Cloud CDN for global performance
4. Set up monitoring and alerts
5. Configure backup strategies
6. Implement CI/CD pipelines
7. Add staging environment
