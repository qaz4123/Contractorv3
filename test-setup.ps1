# PowerShell script to test Contractorv3 setup
Write-Host "🔍 Testing Contractorv3 Setup..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
Write-Host "1. Checking environment configuration..."
if (Test-Path "server\.env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $envContent = Get-Content "server\.env" -Raw
    if ($envContent -match "DATABASE_URL=") {
        $dbUrl = ($envContent -split "`n" | Where-Object { $_ -match "DATABASE_URL=" }) -replace "DATABASE_URL=", "" -replace '"', "" -replace "'", ""
        if ($dbUrl -and $dbUrl.Trim() -ne "") {
            Write-Host "   ✅ DATABASE_URL is set" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  DATABASE_URL is empty - database features won't work" -ForegroundColor Yellow
            Write-Host "      → Edit server\.env and add your DATABASE_URL" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  DATABASE_URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file missing" -ForegroundColor Red
    Write-Host "      → Run: cd server && copy .env.example .env" -ForegroundColor Gray
}
Write-Host ""

# Check if node_modules exist
Write-Host "2. Checking dependencies..."
if (Test-Path "server\node_modules") {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend dependencies missing" -ForegroundColor Red
    Write-Host "      → Run: cd server && npm install" -ForegroundColor Gray
}

if (Test-Path "client\node_modules") {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend dependencies missing" -ForegroundColor Red
    Write-Host "      → Run: cd client && npm install" -ForegroundColor Gray
}
Write-Host ""

# Check if backend is running
Write-Host "3. Checking if backend server is running..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Backend server is running on port 8080" -ForegroundColor Green
    Write-Host "      Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend server is NOT running" -ForegroundColor Red
    Write-Host "      → Start it with: cd server && npm run dev" -ForegroundColor Gray
}
Write-Host ""

# Check if frontend is running
Write-Host "4. Checking if frontend is running..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Frontend is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend is NOT running" -ForegroundColor Red
    Write-Host "      → Start it with: cd client && npm run dev" -ForegroundColor Gray
}
Write-Host ""

Write-Host "✅ Setup check complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If DATABASE_URL is empty, set it up (see SETUP_LOCAL.md)" -ForegroundColor White
Write-Host "2. Start backend: cd server && npm run dev" -ForegroundColor White
Write-Host "3. Start frontend: cd client && npm run dev" -ForegroundColor White
Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White

