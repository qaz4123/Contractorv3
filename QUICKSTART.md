# Contractorv3 Quick Start Guide

## 🚀 Deployment Guide (Separated Architecture - Recommended)

### Prerequisites
1. Google Cloud account with billing enabled
2. `gcloud` CLI installed and configured
3. Project created on GCP

### One-Command Deploy

```bash
# Make deploy script executable (first time only)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
1. Ask what you want to deploy (backend, frontend, or both)
2. Build and deploy the selected components
3. Provide you with the URLs

### Manual Deployment

#### Step 1: Setup GCP Environment

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com

# Create secrets
echo -n "postgresql://user:pass@/db?host=/cloudsql/..." | \
  gcloud secrets create DATABASE_URL --data-file=-

echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create JWT_SECRET --data-file=-

echo -n "your-gemini-api-key" | \
  gcloud secrets create GEMINI_API_KEY --data-file=-

echo -n "your-tavily-api-key" | \
  gcloud secrets create TAVILY_API_KEY --data-file=-

# Create Cloud SQL instance
gcloud sql instances create contractorv3-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create contractorv3 --instance=contractorv3-db

# Create storage bucket for frontend
gsutil mb -l us-central1 gs://contractorv3-frontend
gsutil iam ch allUsers:objectViewer gs://contractorv3-frontend
gsutil web set -m index.html gs://contractorv3-frontend
```

#### Step 2: Deploy Backend

```bash
cd server

# Update cloudbuild.backend.yaml with your Cloud SQL instance name
# Then deploy:
gcloud builds submit --config cloudbuild.backend.yaml

# Get backend URL
gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

#### Step 3: Deploy Frontend

```bash
cd client

# Deploy with backend URL
gcloud builds submit --config cloudbuild.frontend.yaml \
  --substitutions=_BACKEND_URL=https://your-backend-url.run.app
```

### URLs

- **Backend API**: `https://contractorv3-backend-xxx.run.app`
- **Frontend**: `https://storage.googleapis.com/contractorv3-frontend/index.html`

### Testing

```bash
# Test backend health
curl https://contractorv3-backend-xxx.run.app/api/health

# Should return: {"success":true,"status":"healthy",...}
```

---

## 🏠 Local Development

### Backend

```bash
cd server
npm install
cp .env.example .env

# Edit .env with your API keys:
# - DATABASE_URL (local PostgreSQL or Supabase)
# - GEMINI_API_KEY
# - TAVILY_API_KEY
# - JWT_SECRET

# Run Prisma migrations
npx prisma db push

# Start server
npm run dev
# Server runs on http://localhost:8080
```

### Frontend

```bash
cd client
npm install

# Start dev server
npm run dev
# Frontend runs on http://localhost:3000
# Proxies API requests to http://localhost:8080
```

### Full Stack Development

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev

# Open http://localhost:3000
```

---

## 📦 CI/CD Setup (Auto-deploy on Git Push)

### Backend Auto-deploy

```bash
gcloud builds triggers create github \
  --repo-name=Contractorv3 \
  --repo-owner=qaz4123 \
  --branch-pattern="^main$" \
  --build-config=server/cloudbuild.backend.yaml \
  --included-files="server/**" \
  --name=backend-deploy
```

### Frontend Auto-deploy

```bash
gcloud builds triggers create github \
  --repo-name=Contractorv3 \
  --repo-owner=qaz4123 \
  --branch-pattern="^main$" \
  --build-config=client/cloudbuild.frontend.yaml \
  --included-files="client/**" \
  --name=frontend-deploy \
  --substitutions=_BACKEND_URL=https://contractorv3-backend-xxx.run.app
```

Now every push to `main` branch automatically deploys!

---

## 🔧 Common Tasks

### View Backend Logs
```bash
gcloud run services logs read contractorv3-backend \
  --region=us-central1 \
  --limit=50
```

### Update Backend Environment Variables
```bash
gcloud run services update contractorv3-backend \
  --region=us-central1 \
  --set-env-vars="CORS_ORIGIN=https://yourdomain.com"
```

### Update Frontend
```bash
cd client
npm run build
gsutil -m rsync -r -d dist/ gs://contractorv3-frontend/
```

### Rollback Backend
```bash
# List revisions
gcloud run revisions list \
  --service=contractorv3-backend \
  --region=us-central1

# Rollback to previous
gcloud run services update-traffic contractorv3-backend \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

---

## 💰 Cost Estimates

### Production (Separated Architecture)
- **Backend (Cloud Run)**: $5-15/month
- **Frontend (Storage)**: $0.02-0.50/month
- **Database (Cloud SQL)**: $7-10/month
- **Total**: ~$12-25/month

### Development
- Use local PostgreSQL (free)
- Cloud SQL instance can be stopped when not in use

---

## 🔒 Security Checklist

- ✅ All secrets in Secret Manager (never in code)
- ✅ Cloud SQL using private IP
- ✅ CORS configured for your domain
- ✅ HTTPS enforced everywhere
- ✅ Rate limiting enabled on backend
- ✅ Service account with minimal permissions
- ✅ Regular security updates

---

## 📚 Additional Documentation

- **Full Deployment Guide**: [DEPLOYMENT_SEPARATED.md](DEPLOYMENT_SEPARATED.md)
- **Monolithic Deployment**: [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)
- **API Documentation**: Check `/api` endpoints in [README.md](README.md)
- **Workflow Guide**: [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
gcloud run services logs read contractorv3-backend --region=us-central1

# Common issues:
# - DATABASE_URL secret not set
# - Cloud SQL instance not connected
# - Missing API keys in secrets
```

### Frontend shows CORS errors
```bash
# Update backend CORS origin
gcloud run services update contractorv3-backend \
  --region=us-central1 \
  --set-env-vars="CORS_ORIGIN=https://storage.googleapis.com"
```

### Can't connect to database
```bash
# Check Cloud SQL is running
gcloud sql instances list

# Check connection name in backend deployment
gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

---

## 🎯 Next Steps After Deployment

1. **Custom Domain**: Configure your own domain for frontend
2. **Cloud CDN**: Enable CDN for global performance
3. **Monitoring**: Set up Cloud Monitoring alerts
4. **Backups**: Configure automated database backups
5. **SSL Certificate**: Add custom SSL for your domain
6. **Staging Environment**: Create separate staging setup

Need help? Check the detailed guides or raise an issue!
