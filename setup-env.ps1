# Скрипт для создания .env файлов из .env.example

Write-Host "🔧 Создание .env файлов..." -ForegroundColor Cyan

# Backend .env
if (Test-Path "backend\.env.example") {
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Создан backend/.env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  backend/.env уже существует" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Файл backend/.env.example не найден!" -ForegroundColor Red
}

# Frontend .env.local
if (Test-Path "frontend\.env.example") {
    if (-not (Test-Path "frontend\.env.local")) {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
        Write-Host "✅ Создан frontend/.env.local" -ForegroundColor Green
    } else {
        Write-Host "⚠️  frontend/.env.local уже существует" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Файл frontend/.env.example не найден!" -ForegroundColor Red
}

Write-Host "`n✨ Готово! Проверьте файлы и настройте значения." -ForegroundColor Cyan
Write-Host "📖 Подробная инструкция: ENV_SETUP_GUIDE.md" -ForegroundColor Cyan
