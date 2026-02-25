# Script to start the entire project (simplified version)

Write-Host "Starting Event Calendar Platform PROJECT" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Backend dependencies not installed. Installing..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Frontend dependencies not installed. Installing..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Check .env files
Write-Host "Checking .env files..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    Write-Host "backend/.env not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
    }
}
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "frontend/.env.local not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
    }
}

# Start database
Write-Host ""
Write-Host "Starting database (PostgreSQL + Redis)..." -ForegroundColor Cyan
docker-compose up -d postgres redis
Start-Sleep -Seconds 2

# Check if database is running
$dbRunning = docker ps --filter "name=event_calendar_db" --format "{{.Names}}"
if ($dbRunning) {
    Write-Host "Database is running" -ForegroundColor Green
} else {
    Write-Host "Database is not running. Check docker-compose.yml" -ForegroundColor Yellow
}

# Start backend
Write-Host ""
Write-Host "Starting Backend (NestJS)..." -ForegroundColor Cyan
Write-Host "Backend will be available at http://localhost:3000" -ForegroundColor Gray
$backendPath = Join-Path $PWD "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Cyan; npm run start:dev"

# Small delay before starting frontend
Start-Sleep -Seconds 5

# Start frontend
Write-Host ""
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Cyan
Write-Host "Frontend will be available at http://localhost:3001" -ForegroundColor Gray
$frontendPath = Join-Path $PWD "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server' -ForegroundColor Cyan; npm run dev"

# Final information
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services are running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Addresses:" -ForegroundColor Yellow
Write-Host "   Backend API:  http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend:     http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Open in browser: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop:" -ForegroundColor Yellow
Write-Host "   - Close terminal windows (Ctrl+C)" -ForegroundColor Gray
Write-Host "   - Stop database: docker-compose down" -ForegroundColor Gray
Write-Host ""
