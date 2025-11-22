# Python Not Found - Setup Instructions

## The Issue
Python is not installed or not in your system PATH.

## Solution: Install Python

### Option 1: Install from Python.org (Recommended)

1. **Download Python**
   - Visit: https://www.python.org/downloads/
   - Download Python 3.11 or 3.12 (latest stable version)

2. **Install Python**
   - Run the installer
   - ⚠️ **IMPORTANT**: Check "Add Python to PATH" during installation
   - Click "Install Now"

3. **Verify Installation**
   ```powershell
   python --version
   pip --version
   ```

### Option 2: Install from Microsoft Store

1. Open Microsoft Store
2. Search for "Python 3.11" or "Python 3.12"
3. Click "Get" or "Install"
4. Wait for installation to complete

### Option 3: Install with Chocolatey (if you have it)

```powershell
choco install python -y
```

---

## After Installing Python

1. **Close and reopen PowerShell** (important!)

2. **Verify Python is installed:**
   ```powershell
   python --version
   pip --version
   ```

3. **Navigate to the Django project:**
   ```powershell
   cd C:\Project\todo-django
   ```

4. **Run the setup script:**
   ```powershell
   .\start.ps1
   ```

---

## Alternative: Manual Setup (if script fails)

If the start.ps1 script doesn't work, you can set up manually:

```powershell
# Navigate to project
cd C:\Project\todo-django

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create data directory
mkdir data

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

---

## Alternative: Use Docker Instead

If you have Docker installed, you don't need Python:

```powershell
cd C:\Project\todo-django
docker-compose up --build
```

This will run everything in a container!

---

## Troubleshooting

### Python command not found after install?
- Close and reopen PowerShell
- Restart your computer
- Add Python to PATH manually:
  1. Search "Environment Variables" in Windows
  2. Edit "Path" under System Variables
  3. Add: `C:\Users\YourUsername\AppData\Local\Programs\Python\Python311`
  4. Add: `C:\Users\YourUsername\AppData\Local\Programs\Python\Python311\Scripts`

### Permission issues with scripts?
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Quick Decision Tree

**Do you have Python installed?**
- ❌ No → Install Python from python.org (Option 1 above)
- ✅ Yes → Run `python --version` to verify

**Can you run `python --version`?**
- ❌ No → Restart PowerShell or add Python to PATH
- ✅ Yes → Continue to next step

**Do you have Docker?**
- ✅ Yes → Use `docker-compose up --build` (easiest!)
- ❌ No → Continue with Python setup

**Ready to start?**
```powershell
cd C:\Project\todo-django
.\start.ps1
```

---

## Need Help?

If you're still having issues:
1. Make sure Python is properly installed
2. Verify it's in your PATH
3. Restart PowerShell
4. Try the manual setup steps above
5. Or use Docker instead!

---

## Current Status

❌ Python not detected on your system
⚠️ Please install Python before continuing

**Recommended Action:**
Install Python from https://www.python.org/downloads/
✅ Don't forget to check "Add Python to PATH"!

After installation, run:
```powershell
cd C:\Project\todo-django
.\start.ps1
```
