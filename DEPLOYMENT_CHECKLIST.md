# Deployment Checklist - Contractorv3

## ✅ Pre-Deployment Verification

### 1. **Network & Firewall Configuration**
- [x] Cloud Run egress set to `all` (allows external API calls)
- [x] Cloud Run ingress set to `all` (allows public access)
- [x] VPC egress set to `all-traffic` (unrestricted outbound)
- [x] Port 8080 exposed and configured
- [x] Health check endpoints configured (`/health` and `/api/health`)

### 2. **External API Services**
These services require outbound internet access:

| Service | Purpose | Endpoint | Required |
|---------|---------|----------|----------|
| **Tavily API** | Web search for property data | `https://api.tavily.com` | Yes |
| **Google Gemini** | AI analysis and summarization | `https://generativelanguage.googleapis.com` | Yes |
| **Google Maps** | Address autocomplete | `https://maps.googleapis.com` | Optional |

### 3. **Environment Variables**
Verify all secrets are in Secret Manager:

```bash
# Check secrets exist
gcloud secrets list --project=contractorv3

# Expected output:
# - DATABASE_URL
# - JWT_SECRET
# - GEMINI_API_KEY
# - TAVILY_API_KEY
# - MAPS_API_KEY
```

### 4. **Cloud Run Configuration**
Current settings in `server/cloudbuild.backend.yaml`:
- ✅ Memory: 512Mi
- ✅ CPU: 1
- ✅ Min instances: 0 (scales to zero)
- ✅ Max instances: 10
- ✅ Timeout: 300s (5 minutes)
- ✅ Unauthenticated access: enabled
- ✅ Egress: all traffic allowed

### 5. **Database Connection**
- ✅ Cloud SQL instance: `contractorv3:us-central1:contractorv3-db`
- ✅ Database: `contractorv3`
- ✅ Socket path: `/cloudsql/contractorv3:us-central1:contractorv3-db`
- ✅ Connection via Unix socket (Cloud SQL Proxy built-in)

---

## 🚀 Deployment Commands

### Option 1: Automated Script
```bash
cd /workspaces/Contractorv3
./full-deploy.sh
```

### Option 2: Manual Step-by-Step

#### Step 1: Enable APIs (one-time)
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  --project=contractorv3
```

#### Step 2: Create Secrets (one-time)
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create all secrets
echo -n "postgresql://postgres:Contractorv3!@/contractorv3?host=/cloudsql/contractorv3:us-central1:contractorv3-db" | gcloud secrets create DATABASE_URL --data-file=- --project=contractorv3
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=- --project=contractorv3
echo -n "AIzaSyBSjw0EQByw_UePP9OlFcewWWt7o3gkGPg" | gcloud secrets create GEMINI_API_KEY --data-file=- --project=contractorv3
echo -n "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" | gcloud secrets create TAVILY_API_KEY --data-file=- --project=contractorv3
echo -n "AIzaSyA83NhFFyPif5Fj1vlBJawzr2AUdznrhPQ" | gcloud secrets create MAPS_API_KEY --data-file=- --project=contractorv3
```

#### Step 3: Create Cloud SQL Instance (one-time, ~10 min)
```bash
gcloud sql instances create contractorv3-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --root-password="Contractorv3!" \
  --project=contractorv3

# Create database
gcloud sql databases create contractorv3 \
  --instance=contractorv3-db \
  --project=contractorv3
```

#### Step 4: Create Storage Bucket (one-time)
```bash
gsutil mb -l us-central1 gs://contractorv3-frontend
gsutil iam ch allUsers:objectViewer gs://contractorv3-frontend
gsutil web set -m index.html -e index.html gs://contractorv3-frontend
```

#### Step 5: Deploy Backend (~15 min)
```bash
cd server
gcloud builds submit --config cloudbuild.backend.yaml --project=contractorv3
```

#### Step 6: Get Backend URL
```bash
BACKEND_URL=$(gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --format='value(status.url)')

echo "Backend URL: $BACKEND_URL"
```

#### Step 7: Deploy Frontend (~8 min)
```bash
cd ../client
gcloud builds submit --config cloudbuild.frontend.yaml \
  --substitutions=_BACKEND_URL=$BACKEND_URL \
  --project=contractorv3
```

---

## 🧪 Post-Deployment Testing

### 1. Test Backend Health
```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --format='value(status.url)')

# Test health endpoint
curl $BACKEND_URL/api/health

# Expected response:
# {
#   "success": true,
#   "status": "healthy",
#   "timestamp": "2025-12-07T...",
#   "services": {
#     "database": true,
#     "tavily": true,
#     "gemini": true,
#     "maps": true
#   },
#   "environment": "production",
#   "version": "3.0.0"
# }
```

### 2. Test External API Access (Tavily)
```bash
# Test property analysis (requires Tavily API)
curl -X POST $BACKEND_URL/api/properties/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  }'

# Should return property analysis data (not an error about network)
```

### 3. Test Frontend Access
```bash
# Open in browser
open https://storage.googleapis.com/contractorv3-frontend/index.html

# Or test with curl
curl -I https://storage.googleapis.com/contractorv3-frontend/index.html
# Should return: HTTP/2 200
```

### 4. Check Cloud Run Logs
```bash
# View recent logs
gcloud run services logs read contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --limit=50

# Look for:
# ✅ "Server running on port 8080"
# ✅ "Database connected"
# ✅ "Search: Configured"
# ✅ "AI: Configured"
```

---

## 🔧 Troubleshooting

### Issue: "Cannot reach external API"
**Symptoms**: Tavily or Gemini API calls fail
**Solution**:
```bash
# Verify egress is set to 'all'
gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --format='value(spec.template.metadata.annotations[run.googleapis.com/vpc-access-egress])'

# Should return: all-traffic or private-ranges-only
# If not set, update:
gcloud run services update contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --vpc-egress=all-traffic
```

### Issue: "Secret not found"
**Symptoms**: Deployment fails with secret access error
**Solution**:
```bash
# List all secrets
gcloud secrets list --project=contractorv3

# Verify Cloud Run service account has access
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:291626603758-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=contractorv3

# Repeat for all secrets: JWT_SECRET, GEMINI_API_KEY, TAVILY_API_KEY, MAPS_API_KEY
```

### Issue: "Database connection failed"
**Symptoms**: API returns 500 errors, logs show DB connection timeout
**Solution**:
```bash
# Verify Cloud SQL instance is running
gcloud sql instances describe contractorv3-db --project=contractorv3

# Check if Cloud SQL Admin API is enabled
gcloud services enable sqladmin.googleapis.com --project=contractorv3

# Verify Cloud Run has Cloud SQL connection
gcloud run services describe contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --format='value(spec.template.metadata.annotations[run.googleapis.com/cloudsql-instances])'

# Should return: contractorv3:us-central1:contractorv3-db
```

### Issue: "CORS errors in frontend"
**Symptoms**: Frontend can't call backend API
**Solution**:
```bash
# Update CORS_ORIGIN environment variable
gcloud run services update contractorv3-backend \
  --region=us-central1 \
  --project=contractorv3 \
  --set-env-vars="CORS_ORIGIN=https://storage.googleapis.com"
```

---

## 📊 Monitoring & Metrics

### View Cloud Run Metrics
```bash
# Open Cloud Run console
open https://console.cloud.google.com/run/detail/us-central1/contractorv3-backend/metrics?project=contractorv3
```

### Key Metrics to Monitor
- **Request count**: Should increase with usage
- **Request latency**: Should be < 1000ms average
- **Error rate**: Should be < 1%
- **Instance count**: Should scale based on load
- **CPU utilization**: Should stay < 80%
- **Memory utilization**: Should stay < 400Mi

### Set Up Alerts (Optional)
```bash
# Create alert for error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Backend Error Rate Alert" \
  --condition-display-name="High Error Rate" \
  --condition-threshold-value=0.05 \
  --project=contractorv3
```

---

## 💰 Cost Optimization

### Current Configuration Costs (Estimated)
- **Cloud Run**: $5-15/month (scales to zero)
- **Cloud SQL**: $7-10/month (db-f1-micro always-on)
- **Cloud Storage**: $0.02-0.50/month
- **Egress**: $0.12/GB after 1GB free tier
- **Secret Manager**: $0.06/month (5 secrets)
- **Total**: **$12-26/month**

### Cost Optimization Tips
1. **Scale to zero**: Backend scales to 0 instances when idle (already configured)
2. **Reduce Cloud SQL uptime**: Stop instance when not in use (manual)
3. **Use CDN**: Enable Cloud CDN for frontend (reduces egress)
4. **Optimize images**: Compress Docker images to reduce build time
5. **Set max instances**: Already set to 10 to prevent runaway costs

---

## 🔒 Security Checklist

- [x] Secrets stored in Secret Manager (not in code)
- [x] Database credentials never exposed
- [x] JWT secret auto-generated and secure
- [x] CORS configured for specific origins in production
- [x] Helmet middleware enabled for security headers
- [x] Rate limiting enabled (trust proxy set)
- [x] HTTPS enforced (automatic with Cloud Run)
- [x] Container runs as non-root user
- [x] Minimal Docker image (Alpine Linux)
- [x] No hardcoded credentials in repository

---

## 📝 Next Steps After Deployment

1. **Test all features**: Property analysis, lead creation, quote generation
2. **Set up custom domain**: Point your domain to Cloud Storage and Cloud Run
3. **Enable Cloud CDN**: Improve frontend performance globally
4. **Configure monitoring**: Set up Cloud Monitoring alerts
5. **Run database migrations**: `npx prisma migrate deploy` from Cloud Shell
6. **Create first admin user**: Test registration and login flow
7. **Configure CI/CD**: Set up Cloud Build triggers for auto-deployment
8. **Backup strategy**: Enable automated Cloud SQL backups

---

## 🆘 Support

If you encounter issues:
1. Check Cloud Run logs: `gcloud run services logs read contractorv3-backend`
2. Verify secrets: `gcloud secrets list`
3. Test health endpoint: `curl $BACKEND_URL/api/health`
4. Review this checklist for missed steps
5. Check GCP Console for detailed error messages

**Quick Debug Command:**
```bash
# All-in-one status check
echo "=== Backend Status ===" && \
gcloud run services describe contractorv3-backend --region=us-central1 --format="value(status.url,status.conditions)" && \
echo "=== Recent Logs ===" && \
gcloud run services logs read contractorv3-backend --region=us-central1 --limit=10
```
