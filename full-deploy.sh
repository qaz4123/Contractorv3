#!/bin/bash

# Contractorv3 - Full Automated Deployment Script
# Project: contractorv3
# This script will set up everything from scratch

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="contractorv3"
REGION="us-central1"
DB_INSTANCE="contractorv3-db"
BUCKET_NAME="contractorv3-frontend"
DB_PASSWORD="Contractorv3!"

# API Keys (will be stored in Secret Manager)
GEMINI_API_KEY="AIzaSyBSjw0EQByw_UePP9OlFcewWWt7o3gkGPg"
TAVILY_API_KEY="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"
MAPS_API_KEY="AIzaSyA83NhFFyPif5Fj1vlBJawzr2AUdznrhPQ"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Contractorv3 - Automated Deployment  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Project ID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo ""

# Step 0: Authenticate with GCP
echo -e "${YELLOW}[0/10] Authenticating with Google Cloud...${NC}"
echo -e "${BLUE}This will open a browser window for authentication.${NC}"
gcloud auth login --quiet
echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Step 1: Set GCP Project
echo -e "${YELLOW}[1/10] Setting GCP Project...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set${NC}"
echo ""

# Step 2: Enable APIs
echo -e "${YELLOW}[2/10] Enabling Required APIs...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

echo -e "${GREEN}✓ APIs enabled${NC}"
echo ""

# Step 3: Generate JWT Secret
echo -e "${YELLOW}[3/10] Generating JWT Secret...${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ JWT Secret generated${NC}"
echo ""

# Step 4: Create Cloud SQL Instance
echo -e "${YELLOW}[4/10] Creating Cloud SQL Instance...${NC}"
echo -e "${BLUE}This will take 5-10 minutes...${NC}"

if gcloud sql instances describe $DB_INSTANCE --quiet 2>/dev/null; then
    echo -e "${GREEN}✓ Cloud SQL instance already exists${NC}"
else
    gcloud sql instances create $DB_INSTANCE \
      --database-version=POSTGRES_15 \
      --tier=db-f1-micro \
      --region=$REGION \
      --storage-size=10GB \
      --root-password="$DB_PASSWORD" \
      --quiet
    
    echo -e "${GREEN}✓ Cloud SQL instance created${NC}"
    
    # Wait a bit for instance to be ready
    sleep 10
    
    # Create database
    gcloud sql databases create contractorv3 --instance=$DB_INSTANCE --quiet
    echo -e "${GREEN}✓ Database 'contractorv3' created${NC}"
fi
echo ""

# Step 5: Create DATABASE_URL
echo -e "${YELLOW}[5/10] Building Database Connection String...${NC}"
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/contractorv3?host=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
echo -e "${GREEN}✓ Database URL constructed${NC}"
echo ""

# Step 6: Create Secrets in Secret Manager
echo -e "${YELLOW}[6/10] Storing Secrets in Secret Manager...${NC}"

# Function to create or update secret
create_or_update_secret() {
    SECRET_NAME=$1
    SECRET_VALUE=$2
    
    if gcloud secrets describe $SECRET_NAME --quiet 2>/dev/null; then
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --quiet
        echo -e "  ✓ Updated: $SECRET_NAME"
    else
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --quiet
        echo -e "  ✓ Created: $SECRET_NAME"
    fi
}

create_or_update_secret "DATABASE_URL" "$DATABASE_URL"
create_or_update_secret "JWT_SECRET" "$JWT_SECRET"
create_or_update_secret "GEMINI_API_KEY" "$GEMINI_API_KEY"
create_or_update_secret "TAVILY_API_KEY" "$TAVILY_API_KEY"
create_or_update_secret "MAPS_API_KEY" "$MAPS_API_KEY"

echo -e "${GREEN}✓ All secrets stored${NC}"
echo ""

# Step 7: Create Storage Bucket
echo -e "${YELLOW}[7/10] Creating Cloud Storage Bucket...${NC}"

if gsutil ls -b gs://$BUCKET_NAME 2>/dev/null; then
    echo -e "${GREEN}✓ Bucket already exists${NC}"
else
    gsutil mb -l $REGION gs://$BUCKET_NAME
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
    echo -e "${GREEN}✓ Bucket created and configured${NC}"
fi
echo ""

# Step 8: Update Backend Config
echo -e "${YELLOW}[8/10] Updating Backend Configuration...${NC}"
sed -i "s|YOUR_PROJECT_ID|${PROJECT_ID}|g" server/cloudbuild.backend.yaml
echo -e "${GREEN}✓ Backend config updated${NC}"
echo ""

# Step 9: Deploy Backend
echo -e "${YELLOW}[9/10] Deploying Backend to Cloud Run...${NC}"
echo -e "${BLUE}This will take 10-15 minutes...${NC}"

cd server
gcloud builds submit --config cloudbuild.backend.yaml --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe contractorv3-backend \
        --region=$REGION \
        --format='value(status.url)')
    
    echo -e "${GREEN}Backend URL: $BACKEND_URL${NC}"
    echo "$BACKEND_URL" > ../backend-url.txt
    
    cd ..
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    cd ..
    exit 1
fi
echo ""

# Step 10: Deploy Frontend
echo -e "${YELLOW}[10/10] Deploying Frontend to Cloud Storage...${NC}"
echo -e "${BLUE}This will take 5-8 minutes...${NC}"

cd client
gcloud builds submit --config cloudbuild.frontend.yaml \
    --substitutions=_BACKEND_URL=$BACKEND_URL \
    --quiet

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
    cd ..
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    cd ..
    exit 1
fi
echo ""

# Final Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🎉 DEPLOYMENT SUCCESSFUL! 🎉      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📍 Your Application URLs:${NC}"
echo -e "   Backend API:  ${BLUE}$BACKEND_URL${NC}"
echo -e "   Frontend:     ${BLUE}https://storage.googleapis.com/$BUCKET_NAME/index.html${NC}"
echo ""
echo -e "${GREEN}🔧 Quick Tests:${NC}"
echo -e "   Health Check: ${BLUE}curl $BACKEND_URL/api/health${NC}"
echo ""
echo -e "${GREEN}📊 Infrastructure Summary:${NC}"
echo -e "   ✓ Cloud Run Backend (auto-scaling 0-10)"
echo -e "   ✓ Cloud SQL PostgreSQL (db-f1-micro)"
echo -e "   ✓ Cloud Storage Frontend (public bucket)"
echo -e "   ✓ Secret Manager (5 secrets)"
echo ""
echo -e "${YELLOW}💰 Estimated Monthly Cost: \$12-25${NC}"
echo ""
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo -e "   1. Test: curl $BACKEND_URL/api/health"
echo -e "   2. Open: https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo -e "   3. Set up custom domain (optional)"
echo -e "   4. Enable Cloud CDN (optional)"
echo ""
