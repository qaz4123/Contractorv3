# Quick Deployment Guide - Contractorv3

## ✅ Files Status

Both required Cloud Build files are present in your project:
- ✅ `/workspaces/Contractorv3/server/cloudbuild.backend.yaml`
- ✅ `/workspaces/Contractorv3/client/cloudbuild.frontend.yaml`

---

## 🚀 Deployment Options

### **Option 1: Deploy from Google Cloud Shell (Recommended)**

This is the easiest option since Cloud Shell has gcloud pre-installed and authenticated.

#### Steps:

1. **Open Google Cloud Shell**
   - Go to: https://console.cloud.google.com
   - Click the Cloud Shell icon (top right, looks like `>_`)

2. **Clone or Upload Your Project**
   ```bash
   # Option A: Clone from GitHub
   git clone https://github.com/qaz4123/Contractorv3.git
   cd Contractorv3
   
   # Option B: Upload files
   # Click the "⋮" menu in Cloud Shell → Upload → Upload folder
   ```

3. **Set Your Project**
   ```bash
   gcloud config set project contractorv3
   ```

4. **Run the Full Deployment Script**
   ```bash
   chmod +x full-deploy.sh
   ./full-deploy.sh
   ```

   **OR** deploy manually:

   **Step A: Enable APIs & Create Infrastructure** (one-time, ~15-20 min)
   ```bash
   # Enable APIs
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     sqladmin.googleapis.com \
     storage.googleapis.com \
     secretmanager.googleapis.com

   # Create Cloud SQL
   gcloud sql instances create contractorv3-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1 \
     --storage-size=10GB \
     --root-password="Contractorv3!"

   gcloud sql databases create contractorv3 --instance=contractorv3-db

   # Create secrets
   JWT_SECRET=$(openssl rand -base64 32)
   echo -n "postgresql://postgres:Contractorv3!@/contractorv3?host=/cloudsql/contractorv3:us-central1:contractorv3-db" | gcloud secrets create DATABASE_URL --data-file=-
   echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-
   echo -n "AIzaSyBSjw0EQByw_UePP9OlFcewWWt7o3gkGPg" | gcloud secrets create GEMINI_API_KEY --data-file=-
   echo -n "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" | gcloud secrets create TAVILY_API_KEY --data-file=-
   echo -n "AIzaSyA83NhFFyPif5Fj1vlBJawzr2AUdznrhPQ" | gcloud secrets create MAPS_API_KEY --data-file=-

   # Create storage bucket
   gsutil mb -l us-central1 gs://contractorv3-frontend
   gsutil iam ch allUsers:objectViewer gs://contractorv3-frontend
   gsutil web set -m index.html -e index.html gs://contractorv3-frontend
   ```

   **Step B: Deploy Backend** (~10-15 min)
   ```bash
   cd server
   gcloud builds submit --config cloudbuild.backend.yaml
   ```

   **Step C: Deploy Frontend** (~5-8 min)
   ```bash
   # Get backend URL
   BACKEND_URL=$(gcloud run services describe contractorv3-backend \
     --region=us-central1 \
     --format='value(status.url)')

   cd ../client
   gcloud builds submit --config cloudbuild.frontend.yaml \
     --substitutions=_BACKEND_URL=$BACKEND_URL
   ```

5. **Test Deployment**
   ```bash
   cd ..
   ./test-deployment.sh
   ```

---

### **Option 2: Deploy from Your Local Machine**

If you have gcloud CLI installed locally:

1. **Install Google Cloud SDK** (if not installed)
   - Download from: https://cloud.google.com/sdk/docs/install

2. **Authenticate**
   ```bash
   gcloud auth login
   gcloud config set project contractorv3
   ```

3. **Navigate to Project**
   ```bash
   cd /path/to/Contractorv3
   ```

4. **Deploy** (same commands as Cloud Shell Option 1, Step 4)

---

### **Option 3: Use Provided Credentials File**

If you have a service account key file:

1. **Set Credentials**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
   gcloud config set project contractorv3
   ```

2. **Deploy** (same commands as Cloud Shell Option 1, Step 4)

---

## 📋 Verify Files Are Present

Before deploying, verify the Cloud Build files exist:

```bash
# Check if files exist
ls -la server/cloudbuild.backend.yaml
ls -la client/cloudbuild.frontend.yaml

# Both should show the file paths (not "No such file")
```

**Expected output:**
```
-rw-r--r-- 1 user user 1234 Dec  7 12:00 server/cloudbuild.backend.yaml
-rw-r--r-- 1 user user 1567 Dec  7 12:00 client/cloudbuild.frontend.yaml
```

---

## 🎯 Quick Deploy (All Commands in One Place)

**Copy-paste this entire block into Google Cloud Shell:**

```bash
# Set project
gcloud config set project contractorv3

# Enable APIs (one-time)
gcloud services enable cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com storage.googleapis.com secretmanager.googleapis.com

# Create Cloud SQL (one-time, ~10 min)
gcloud sql instances create contractorv3-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=us-central1 --storage-size=10GB --root-password="Contractorv3!"
gcloud sql databases create contractorv3 --instance=contractorv3-db

# Create secrets (one-time)
JWT_SECRET=$(openssl rand -base64 32)
echo -n "postgresql://postgres:Contractorv3!@/contractorv3?host=/cloudsql/contractorv3:us-central1:contractorv3-db" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "AIzaSyBSjw0EQByw_UePP9OlFcewWWt7o3gkGPg" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "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" | gcloud secrets create TAVILY_API_KEY --data-file=-
echo -n "AIzaSyA83NhFFyPif5Fj1vlBJawzr2AUdznrhPQ" | gcloud secrets create MAPS_API_KEY --data-file=-

# Create bucket (one-time)
gsutil mb -l us-central1 gs://contractorv3-frontend
gsutil iam ch allUsers:objectViewer gs://contractorv3-frontend
gsutil web set -m index.html -e index.html gs://contractorv3-frontend

# Deploy backend (~10-15 min)
cd server
gcloud builds submit --config cloudbuild.backend.yaml

# Deploy frontend (~5-8 min)
BACKEND_URL=$(gcloud run services describe contractorv3-backend --region=us-central1 --format='value(status.url)')
cd ../client
gcloud builds submit --config cloudbuild.frontend.yaml --substitutions=_BACKEND_URL=$BACKEND_URL

# Done!
echo "Backend: $BACKEND_URL"
echo "Frontend: https://storage.googleapis.com/contractorv3-frontend/index.html"
```

---

## ✅ Success Indicators

After deployment, you should see:

1. **Backend URL**: `https://contractorv3-backend-xxx.run.app`
2. **Frontend URL**: `https://storage.googleapis.com/contractorv3-frontend/index.html`

Test with:
```bash
curl https://contractorv3-backend-xxx.run.app/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected",
    "tavily": true,
    "gemini": true,
    "maps": true
  },
  "version": "3.0.0"
}
```

---

## 🆘 Troubleshooting

### If you see "files are missing":
- You're likely in the wrong directory
- Run: `pwd` to check current directory
- Should be: `/workspaces/Contractorv3` or similar
- Run: `ls server/cloudbuild.backend.yaml` to verify

### If gcloud is not found:
- You're not in Google Cloud Shell or don't have gcloud installed locally
- **Solution**: Use Google Cloud Shell (Option 1 above)

### If secrets already exist:
- Skip the secret creation commands
- Or delete and recreate: `gcloud secrets delete SECRET_NAME && echo -n "VALUE" | gcloud secrets create SECRET_NAME --data-file=-`

---

## 📊 Estimated Time

- **First-time setup**: 30-40 minutes
- **Subsequent deployments**: 15-20 minutes
- **Backend only**: 10-15 minutes
- **Frontend only**: 5-8 minutes

---

## 💡 Need Help?

The Cloud Build configuration files ARE present in your project at:
- `server/cloudbuild.backend.yaml` ✅
- `client/cloudbuild.frontend.yaml` ✅

If someone told you they're missing, they may be:
1. Looking in the wrong directory
2. Not in the project root
3. Need to pull latest changes from git

**To verify locally:**
```bash
cd /workspaces/Contractorv3
find . -name "cloudbuild*.yaml"
```

Should show:
```
./server/cloudbuild.backend.yaml
./client/cloudbuild.frontend.yaml
./cloudbuild.yaml
```
