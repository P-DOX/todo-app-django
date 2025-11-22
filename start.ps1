# Quick Start Script for Django Todo App
# This script sets up and runs the Django todo app

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Django Todo App - Quick Start" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking for Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "Dependencies installed" -ForegroundColor Green

# Create data directory
if (!(Test-Path "data")) {
    Write-Host "Creating data directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "Data directory created" -ForegroundColor Green
}

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate --no-input
Write-Host "Database migrations complete" -ForegroundColor Green

# Check if superuser exists
Write-Host ""
Write-Host "Do you want to create a superuser for Django admin? (y/n)" -ForegroundColor Cyan
$createSuperuser = Read-Host
if ($createSuperuser -eq 'y') {
    python manage.py createsuperuser
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Starting development server..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application will be available at:" -ForegroundColor Green
Write-Host "  http://localhost:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Django Admin available at:" -ForegroundColor Green
Write-Host "  http://localhost:8000/admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
python manage.py runserver
