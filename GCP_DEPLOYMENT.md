# Google Cloud Platform Deployment - Quick Start

## ✅ Your Code is GCP-Compatible!

Docker build succeeds ✓  
Backend compiles ✓  
Frontend builds ✓  

---

## Required GCP Secrets

You need to create these secrets in **Secret Manager**:

### 1. DATABASE_URL
Your Cloud SQL PostgreSQL connection string:
```
postgresql://postgres:PASSWORD@/contractor_crm?host=/cloudsql/property-analyzer-ai:us-central1:property
```

### 2. GEMINI_API_KEY
Your Google Gemini API key (already created: `projects/618962418326/secrets/Gemini`)

### 3. TAVILY_API_KEY
Your Tavily search API key (already created: `projects/618962418326/secrets/Tavily`)

### 4. JWT_SECRET
A random secret for JWT tokens (create a strong 32+ character string)

### 5. MAPS_API_KEY
Your Google Maps API key (already created: `projects/618962418326/secrets/Map`)

---

## Quick Commands to Create Missing Secrets

```bash
# Set your project
gcloud config set project property-analyzer-ai

# Create DATABASE_URL secret
echo -n "postgresql://postgres:YOUR_PASSWORD@/contractor_crm?host=/cloudsql/property-analyzer-ai:us-central1:property" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Create JWT_SECRET
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create JWT_SECRET --data-file=-

# Verify all secrets exist
gcloud secrets list
```

---

## Deploy to Cloud Run

### Option 1: Manual Deploy (Quick Test)

```bash
# Build and push
gcloud builds submit --config cloudbuild.yaml

# That's it! Cloud Build will:
# 1. Build Docker image
# 2. Push to Container Registry
# 3. Deploy to Cloud Run
# 4. Connect to Cloud SQL
# 5. Inject secrets
```

### Option 2: Automatic Deploy on Git Push

1. Go to **Cloud Build** → **Triggers**
2. Click **Create Trigger**
3. Configure:
   - **Name**: `deploy-on-push`
   - **Event**: Push to branch
   - **Source**: `qaz4123/property-analyzer-v2`
   - **Branch**: `^main$`
   - **Configuration**: `cloudbuild.yaml`
4. Click **Create**

Now every push to `main` auto-deploys!

---

## After Deployment

### Get Your Backend URL
```bash
gcloud run services describe contractor-crm-v2 --region=us-central1 --format='value(status.url)'
```

You'll get something like:
```
https://contractor-crm-v2-abc123-uc.a.run.app
```

### Update Frontend Environment
The frontend is deployed with the backend on Cloud Run.
Backend URL is automatically configured in the Docker build.

---

## Verify Deployment

```bash
# Check service status
gcloud run services describe contractor-crm-v2 --region=us-central1

# View logs
gcloud run services logs read contractor-crm-v2 --region=us-central1

# Test health endpoint
curl https://YOUR-CLOUD-RUN-URL/health
```

---

## Cost Estimate

**Cloud Run**: $0 (free tier up to 2M requests/month)  
**Cloud SQL**: ~$10-15/month (db-f1-micro)  
**Container Registry**: ~$0.10/month (storage)  
**Secret Manager**: ~$0.10/month  
**Total**: ~$10-20/month

---

## Troubleshooting

### Build Fails
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### Secrets Not Found
```bash
# List all secrets
gcloud secrets list

# Create missing ones (see above)
```

### Cloud SQL Connection Issues
```bash
# Verify Cloud SQL instance name matches cloudbuild.yaml
gcloud sql instances describe property --format='value(connectionName)'

# Should match: property-analyzer-ai:us-central1:property
```

### Service Won't Start
```bash
# Check logs
gcloud run services logs read contractor-crm-v2 --region=us-central1 --limit=50

# Common issues:
# - Missing DATABASE_URL secret
# - Wrong Cloud SQL connection string
# - Missing JWT_SECRET
```

---

## Next Steps

1. ✅ Create missing secrets (DATABASE_URL, JWT_SECRET)
2. ✅ Run `gcloud builds submit --config cloudbuild.yaml`
3. ✅ Get Cloud Run URL
## Next Steps

1. ✅ Create missing secrets (DATABASE_URL, JWT_SECRET)
2. ✅ Run `gcloud builds submit --config cloudbuild.yaml`
3. ✅ Get Cloud Run URL
4. ✅ Test the app!

Your code is ready. Just need to set up the secrets and deploy!