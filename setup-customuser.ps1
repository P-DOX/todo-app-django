# Script to setup the custom user model and create fresh database

Write-Host "=== Custom User Model Setup ===" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location C:\Project\todo-django

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\.venv\Scripts\Activate.ps1"

# Remove old database
Write-Host "Removing old database..." -ForegroundColor Yellow
if (Test-Path "data\db.sqlite3") {
    Remove-Item "data\db.sqlite3" -Force
    Write-Host "  ✓ Old database removed" -ForegroundColor Green
} else {
    Write-Host "  - No old database found" -ForegroundColor Gray
}

# Remove old migrations (except __init__.py)
Write-Host "Removing old migrations..." -ForegroundColor Yellow
if (Test-Path "tasks\migrations") {
    Get-ChildItem "tasks\migrations\*.py" -Exclude "__init__.py" | Remove-Item -Force
    Write-Host "  ✓ Old migrations removed" -ForegroundColor Green
}

# Create new migrations
Write-Host ""
Write-Host "Creating new migrations..." -ForegroundColor Yellow
python manage.py makemigrations

# Run migrations
Write-Host ""
Write-Host "Applying migrations..." -ForegroundColor Yellow
python manage.py migrate

# Create superuser prompt
Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To create a superuser, run:" -ForegroundColor Cyan
Write-Host "  python manage.py createsuperuser" -ForegroundColor White
Write-Host ""
Write-Host "To start the server, run:" -ForegroundColor Cyan
Write-Host "  python manage.py runserver" -ForegroundColor White
Write-Host ""
