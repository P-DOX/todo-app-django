# Todo App - Automated Setup Script for Windows
# Run this script to set up the application quickly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Todo App - Automated Setup (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found! Please install Python 3.8+ from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Skipping creation." -ForegroundColor Gray
} else {
    python -m venv venv
    if ($?) {
        Write-Host "✓ Virtual environment created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
if ($?) {
    Write-Host "✓ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to activate virtual environment" -ForegroundColor Red
    Write-Host "You may need to run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet
if ($?) {
    Write-Host "✓ pip upgraded successfully" -ForegroundColor Green
} else {
    Write-Host "! Warning: Failed to upgrade pip, continuing anyway..." -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Yellow
Write-Host "(This may take a few minutes)" -ForegroundColor Gray
pip install -r requirements.txt --quiet
if ($?) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create data directory
Write-Host ""
Write-Host "Creating data directory..." -ForegroundColor Yellow
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" -Force | Out-Null
    Write-Host "✓ Data directory created" -ForegroundColor Green
} else {
    Write-Host "Data directory already exists. Skipping." -ForegroundColor Gray
}

# Run database migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate
if ($?) {
    Write-Host "✓ Database migrations completed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to run migrations" -ForegroundColor Red
    exit 1
}

# Collect static files (in case needed)
Write-Host ""
Write-Host "Collecting static files..." -ForegroundColor Yellow
python manage.py collectstatic --noinput --clear 2>&1 | Out-Null
if ($?) {
    Write-Host "✓ Static files collected" -ForegroundColor Green
} else {
    Write-Host "! Static files collection skipped (not critical)" -ForegroundColor Yellow
}

# Setup complete
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ Setup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. (Optional) Create a superuser for admin access:" -ForegroundColor White
Write-Host "   python manage.py createsuperuser" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the development server:" -ForegroundColor White
Write-Host "   python manage.py runserver" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open your browser and visit:" -ForegroundColor White
Write-Host "   http://localhost:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Admin panel (if you created a superuser):" -ForegroundColor White
Write-Host "   http://localhost:8000/admin" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to start the server now
Write-Host "Would you like to start the development server now? (Y/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y" -or $response -eq "") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    python manage.py runserver
} else {
    Write-Host ""
    Write-Host "Setup complete! Run 'python manage.py runserver' when ready." -ForegroundColor Cyan
}
