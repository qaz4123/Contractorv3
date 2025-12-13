#!/bin/bash

# Contractorv3 - Quick Deploy Script (Separated Architecture)
# This script deploys frontend and backend independently to GCP

set -e

echo "🚀 Contractorv3 Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No GCP project selected${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ GCP Project: $PROJECT_ID${NC}"
echo ""

# Ask what to deploy
echo "What do you want to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (recommended for first deployment)"
read -p "Enter choice [1-3]: " DEPLOY_CHOICE

# Backend deployment
deploy_backend() {
    echo ""
    echo -e "${YELLOW}📦 Deploying Backend to Cloud Run...${NC}"
    cd server
    
    gcloud builds submit --config cloudbuild.backend.yaml
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
        
        # Get backend URL
        BACKEND_URL=$(gcloud run services describe contractorv3-backend \
            --region=us-central1 \
            --format='value(status.url)')
        
        echo -e "${GREEN}Backend URL: $BACKEND_URL${NC}"
        echo "$BACKEND_URL" > ../backend-url.txt
        
        cd ..
        return 0
    else
        echo -e "${RED}❌ Backend deployment failed${NC}"
        cd ..
        return 1
    fi
}

# Frontend deployment
deploy_frontend() {
    echo ""
    echo -e "${YELLOW}📦 Deploying Frontend to Cloud Storage...${NC}"
    
    # Get backend URL
    if [ -f "backend-url.txt" ]; then
        BACKEND_URL=$(cat backend-url.txt)
    else
        read -p "Enter Backend URL: " BACKEND_URL
    fi
    
    if [ -z "$BACKEND_URL" ]; then
        echo -e "${RED}❌ Error: Backend URL is required${NC}"
        return 1
    fi
    
    cd client
    
    gcloud builds submit --config cloudbuild.frontend.yaml \
        --substitutions=_BACKEND_URL=$BACKEND_URL
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
        echo -e "${GREEN}Frontend URL: https://storage.googleapis.com/contractorv3-frontend/index.html${NC}"
        cd ..
        return 0
    else
        echo -e "${RED}❌ Frontend deployment failed${NC}"
        cd ..
        return 1
    fi
}

# Deploy based on choice
case $DEPLOY_CHOICE in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend && deploy_frontend
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Deployment summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""

if [ -f "backend-url.txt" ]; then
    BACKEND_URL=$(cat backend-url.txt)
    echo -e "Backend API: ${GREEN}$BACKEND_URL${NC}"
fi

echo -e "Frontend: ${GREEN}https://storage.googleapis.com/contractorv3-frontend/index.html${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Test the API: curl \$BACKEND_URL/api/health"
echo "2. Open frontend in browser"
echo "3. Set up custom domain (optional)"
echo "4. Enable Cloud CDN for frontend (optional)"
echo ""
