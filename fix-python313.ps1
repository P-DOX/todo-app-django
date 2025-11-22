# Fix for Python 3.13 compatibility issue
# Run this script to fix the pkg_resources error

Write-Host "Fixing Python 3.13 compatibility..." -ForegroundColor Cyan

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
}

# Install setuptools (fixes pkg_resources issue)
Write-Host "Installing setuptools..." -ForegroundColor Yellow
python -m pip install setuptools --quiet
Write-Host "Setuptools installed" -ForegroundColor Green

# Reinstall dependencies
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt --quiet
Write-Host "Dependencies installed" -ForegroundColor Green

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
python manage.py migrate --no-input
Write-Host "Migrations complete" -ForegroundColor Green

Write-Host ""
Write-Host "Fix complete! Now you can run:" -ForegroundColor Green
Write-Host "  python manage.py runserver" -ForegroundColor Yellow
Write-Host ""
