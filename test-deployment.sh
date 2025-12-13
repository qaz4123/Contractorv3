#!/bin/bash

# Contractorv3 - Deployment Test & Verification Script
# Tests all critical services and network connectivity

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID="contractorv3"
REGION="us-central1"
SERVICE_NAME="contractorv3-backend"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Contractorv3 - Deployment Testing   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Get Backend URL
echo -e "${YELLOW}[1/7] Getting Backend URL...${NC}"
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)' 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend not deployed yet${NC}"
    echo "Run: cd server && gcloud builds submit --config cloudbuild.backend.yaml"
    exit 1
else
    echo -e "${GREEN}✓ Backend URL: $BACKEND_URL${NC}"
fi
echo ""

# Test 2: Health Check
echo -e "${YELLOW}[2/7] Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP $HTTP_CODE)${NC}"
    echo "$HEALTH_BODY" | jq '.' 2>/dev/null || echo "$HEALTH_BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "$HEALTH_BODY"
fi
echo ""

# Test 3: Check Services Status
echo -e "${YELLOW}[3/7] Checking External Services Configuration...${NC}"
if echo "$HEALTH_BODY" | jq -e '.services' > /dev/null 2>&1; then
    DATABASE=$(echo "$HEALTH_BODY" | jq -r '.services.database')
    TAVILY=$(echo "$HEALTH_BODY" | jq -r '.services.tavily')
    GEMINI=$(echo "$HEALTH_BODY" | jq -r '.services.gemini')
    MAPS=$(echo "$HEALTH_BODY" | jq -r '.services.maps')
    
    echo -e "  Database: $([ "$DATABASE" = "connected" ] && echo "${GREEN}✓ Connected${NC}" || echo "${RED}✗ Not connected${NC}")"
    echo -e "  Tavily API: $([ "$TAVILY" = "true" ] && echo "${GREEN}✓ Configured${NC}" || echo "${RED}✗ Not configured${NC}")"
    echo -e "  Gemini AI: $([ "$GEMINI" = "true" ] && echo "${GREEN}✓ Configured${NC}" || echo "${RED}✗ Not configured${NC}")"
    echo -e "  Maps API: $([ "$MAPS" = "true" ] && echo "${GREEN}✓ Configured${NC}" || echo "${YELLOW}⚠ Optional${NC}")"
else
    echo -e "${YELLOW}⚠ Could not parse service status${NC}"
fi
echo ""

# Test 4: Test External API Connectivity (Tavily)
echo -e "${YELLOW}[4/7] Testing External API Connectivity...${NC}"
echo -e "${BLUE}Testing property analysis (uses Tavily API)...${NC}"

PROPERTY_TEST=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/properties/analyze" \
  -H "Content-Type: application/json" \
  -d '{"address":"1600 Amphitheatre Parkway, Mountain View, CA"}' 2>/dev/null || echo "000")

PROPERTY_CODE=$(echo "$PROPERTY_TEST" | tail -n 1)
PROPERTY_BODY=$(echo "$PROPERTY_TEST" | head -n -1)

if [ "$PROPERTY_CODE" = "200" ] || [ "$PROPERTY_CODE" = "201" ]; then
    echo -e "${GREEN}✓ External API calls working (HTTP $PROPERTY_CODE)${NC}"
    echo -e "${GREEN}✓ Tavily search accessible${NC}"
elif [ "$PROPERTY_CODE" = "401" ] || [ "$PROPERTY_CODE" = "403" ]; then
    echo -e "${YELLOW}⚠ Authentication required (HTTP $PROPERTY_CODE)${NC}"
    echo -e "${YELLOW}  This is expected if auth is enabled${NC}"
elif echo "$PROPERTY_BODY" | grep -q "ECONNREFUSED\|ETIMEDOUT\|network"; then
    echo -e "${RED}❌ Network connectivity issue detected${NC}"
    echo -e "${RED}  Egress may be blocked. Check firewall settings.${NC}"
else
    echo -e "${YELLOW}⚠ API test returned HTTP $PROPERTY_CODE${NC}"
    echo "$PROPERTY_BODY" | head -n 3
fi
echo ""

# Test 5: Check Cloud Run Configuration
echo -e "${YELLOW}[5/7] Verifying Cloud Run Configuration...${NC}"

# Check egress
EGRESS=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(spec.template.metadata.annotations[run.googleapis.com/vpc-access-egress])' 2>/dev/null)

if [ "$EGRESS" = "all-traffic" ] || [ "$EGRESS" = "private-ranges-only" ]; then
    echo -e "${GREEN}✓ Egress configured: $EGRESS${NC}"
else
    echo -e "${YELLOW}⚠ Egress not set (uses default: all-traffic)${NC}"
fi

# Check Cloud SQL connection
CLOUDSQL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(spec.template.metadata.annotations[run.googleapis.com/cloudsql-instances])' 2>/dev/null)

if [ -n "$CLOUDSQL" ]; then
    echo -e "${GREEN}✓ Cloud SQL connected: $CLOUDSQL${NC}"
else
    echo -e "${RED}❌ Cloud SQL not configured${NC}"
fi
echo ""

# Test 6: Check Secrets
echo -e "${YELLOW}[6/7] Checking Secrets Configuration...${NC}"
REQUIRED_SECRETS=("DATABASE_URL" "JWT_SECRET" "GEMINI_API_KEY" "TAVILY_API_KEY" "MAPS_API_KEY")

for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets describe "$SECRET" --project=$PROJECT_ID &>/dev/null; then
        echo -e "  ${GREEN}✓ $SECRET${NC}"
    else
        echo -e "  ${RED}✗ $SECRET (missing)${NC}"
    fi
done
echo ""

# Test 7: Frontend Check
echo -e "${YELLOW}[7/7] Testing Frontend...${NC}"
FRONTEND_URL="https://storage.googleapis.com/contractorv3-frontend/index.html"
FRONTEND_TEST=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL" 2>/dev/null || echo "000")

if [ "$FRONTEND_TEST" = "200" ]; then
    echo -e "${GREEN}✓ Frontend accessible: $FRONTEND_URL${NC}"
elif [ "$FRONTEND_TEST" = "404" ]; then
    echo -e "${YELLOW}⚠ Frontend not deployed yet${NC}"
    echo "Run: cd client && gcloud builds submit --config cloudbuild.frontend.yaml --substitutions=_BACKEND_URL=$BACKEND_URL"
else
    echo -e "${RED}❌ Frontend check failed (HTTP $FRONTEND_TEST)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Test Summary                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Backend URL:${NC} $BACKEND_URL"
echo -e "${GREEN}Frontend URL:${NC} $FRONTEND_URL"
echo ""
echo -e "${YELLOW}Quick Access Commands:${NC}"
echo -e "  Test API: ${BLUE}curl $BACKEND_URL/api/health${NC}"
echo -e "  View logs: ${BLUE}gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50${NC}"
echo -e "  Open frontend: ${BLUE}open $FRONTEND_URL${NC}"
echo ""

if [ "$HTTP_CODE" = "200" ] && [ "$FRONTEND_TEST" = "200" ]; then
    echo -e "${GREEN}🎉 All systems operational!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some issues detected. Review output above.${NC}"
    exit 1
fi
