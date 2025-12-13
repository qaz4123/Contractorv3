#!/bin/bash

# Test Connection Script
# Tests database and API connections

echo "🔍 Testing Contractorv3 Connections..."
echo ""

# Check if server is running
echo "1. Checking if backend server is running..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "   ✅ Backend server is running on port 8080"
    curl -s http://localhost:8080/health | jq . 2>/dev/null || curl -s http://localhost:8080/health
else
    echo "   ❌ Backend server is NOT running on port 8080"
    echo "   → Start it with: cd server && npm run dev"
fi
echo ""

# Check if frontend is running
echo "2. Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 3000"
else
    echo "   ❌ Frontend is NOT running on port 3000"
    echo "   → Start it with: cd client && npm run dev"
fi
echo ""

# Check API endpoint
echo "3. Testing API endpoint..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "   ✅ API endpoint is accessible"
    curl -s http://localhost:8080/api/health | jq . 2>/dev/null || curl -s http://localhost:8080/api/health
else
    echo "   ❌ API endpoint is NOT accessible"
fi
echo ""

# Check database connection (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo "4. DATABASE_URL is set (checking connection...)"
    # Try to connect (requires psql)
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "   ✅ Database connection successful"
        else
            echo "   ❌ Database connection failed"
            echo "   → Check your DATABASE_URL in .env file"
        fi
    else
        echo "   ⚠️  psql not installed - cannot test database connection"
    fi
else
    echo "4. DATABASE_URL is not set"
    echo "   ⚠️  Database features will not work"
    echo "   → Create server/.env file with DATABASE_URL"
fi
echo ""

echo "✅ Connection test complete!"

