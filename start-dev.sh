#!/bin/bash

# Start Contractorv3 Development Environment

echo "🚀 Starting Contractorv3..."

# Check if Docker postgres is running
if ! docker ps | grep -q contractorv3-db; then
    echo "📦 Starting PostgreSQL..."
    docker start contractorv3-db 2>/dev/null || docker run -d --name contractorv3-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=contractorv3 -p 5432:5432 postgres:15-alpine
    sleep 3
fi

# Kill any existing processes
pkill -f "tsx watch" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Start backend in background
echo "🔧 Starting Backend on port 8080..."
cd /workspaces/Contractorv3/server
npm run dev &
BACKEND_PID=$!

sleep 5

# Start frontend in background
echo "🎨 Starting Frontend on port 5173..."
cd /workspaces/Contractorv3/client
npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "✅ Contractorv3 is running!"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo ""
echo "🔐 Demo Login:"
echo "   Email:    demo@contractorcrm.com"
echo "   Password: Demo123!"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
