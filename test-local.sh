#!/bin/bash
# Test Development Environment

echo "🧪 Testing Contractorv3 Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Backend Health
echo "1️⃣  Testing Backend Health..."
HEALTH=$(curl -s http://localhost:8080/api/health)
if echo "$HEALTH" | grep -q '"database":"connected"'; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo -e "${GREEN}✅ Database connected${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Response: $HEALTH"
    exit 1
fi

# Check API Keys
if echo "$HEALTH" | grep -q '"gemini":true'; then
    echo -e "${GREEN}✅ Gemini API configured${NC}"
else
    echo -e "${YELLOW}⚠️  Gemini API not configured${NC}"
fi

if echo "$HEALTH" | grep -q '"tavily":true'; then
    echo -e "${GREEN}✅ Tavily API configured${NC}"
else
    echo -e "${YELLOW}⚠️  Tavily API not configured${NC}"
fi

if echo "$HEALTH" | grep -q '"maps":true'; then
    echo -e "${GREEN}✅ Maps API configured${NC}"
else
    echo -e "${YELLOW}⚠️  Maps API not configured (address autocomplete disabled)${NC}"
fi

echo ""

# Test Login
echo "2️⃣  Testing Login..."
LOGIN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@contractorcrm.com","password":"Demo123!"}')

if echo "$LOGIN" | grep -q '"success":true'; then
    USER_NAME=$(echo "$LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['name'])" 2>/dev/null)
    echo -e "${GREEN}✅ Login successful: $USER_NAME${NC}"
    
    # Extract token for subsequent requests
    TOKEN=$(echo "$LOGIN" | python3 -c "import sys, json; print(json.load(sys.stdin)['tokens']['accessToken'])" 2>/dev/null)
else
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

echo ""

# Test Leads Endpoint
echo "3️⃣  Testing Leads API..."
LEADS=$(curl -s http://localhost:8080/api/leads \
  -H "Authorization: Bearer $TOKEN")

if echo "$LEADS" | grep -q '"success":true'; then
    LEAD_COUNT=$(echo "$LEADS" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])" 2>/dev/null)
    echo -e "${GREEN}✅ Leads API working (${LEAD_COUNT} leads)${NC}"
else
    echo -e "${RED}❌ Leads API failed${NC}"
fi

echo ""

# Test Frontend
echo "4️⃣  Testing Frontend..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$FRONTEND" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3000${NC}"
elif [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173)" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not responding${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Development Environment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "🔗 ${GREEN}Frontend:${NC}  http://localhost:3000 (or :5173)"
echo -e "🔗 ${GREEN}Backend:${NC}   http://localhost:8080"
echo ""
echo -e "🔐 ${GREEN}Demo Login:${NC}"
echo "   Email:    demo@contractorcrm.com"
echo "   Password: Demo123!"
echo ""

if echo "$HEALTH" | grep -q '"maps":false'; then
    echo -e "${YELLOW}⚠️  Google Maps API not configured${NC}"
    echo "   See GOOGLE_MAPS_SETUP.md for instructions"
    echo ""
fi

echo "✨ Ready for development!"
