# Python 3.13 Compatibility Fix

## The Issue

You're using Python 3.13, which is very new. The `djangorestframework-simplejwt` package has a compatibility issue where it tries to import `pkg_resources`, which is no longer included by default in Python 3.13.

**Error Message:**
```
ModuleNotFoundError: No module named 'pkg_resources'
```

---

## ✅ Quick Fix

Run this command in your PowerShell:

```powershell
cd C:\Project\todo-django
python -m pip install setuptools
python manage.py migrate
python manage.py runserver
```

---

## ✅ Or Use the Fix Script

```powershell
cd C:\Project\todo-django
.\fix-python313.ps1
```

Then start the server:
```powershell
python manage.py runserver
```

---

## ✅ Manual Step-by-Step

If the above doesn't work, follow these steps:

### 1. Activate Virtual Environment
```powershell
cd C:\Project\todo-django
.\venv\Scripts\Activate.ps1
```

### 2. Install Setuptools
```powershell
pip install setuptools
```

### 3. Verify Installation
```powershell
python -c "import pkg_resources; print('Success!')"
```

### 4. Run Migrations
```powershell
python manage.py migrate
```

### 5. Create Superuser (Optional)
```powershell
python manage.py createsuperuser
```

### 6. Start Server
```powershell
python manage.py runserver
```

### 7. Open Browser
Visit: http://localhost:8000

---

## Alternative: Use Python 3.11 or 3.12

If you continue to have issues, you can install Python 3.11 or 3.12 instead:

1. **Download Python 3.12:** https://www.python.org/downloads/
2. **Install it**
3. **Delete the old virtual environment:**
   ```powershell
   cd C:\Project\todo-django
   Remove-Item -Recurse -Force venv
   ```
4. **Create new venv with Python 3.12:**
   ```powershell
   py -3.12 -m venv venv
   ```
5. **Activate and continue:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

---

## Why This Happens

- **Python 3.13** removed `setuptools` from the default installation
- **`pkg_resources`** is part of `setuptools`
- **`djangorestframework-simplejwt`** still imports `pkg_resources`
- **Solution:** Manually install `setuptools`

---

## Updated Requirements

The `requirements.txt` has been updated to include:
```
setuptools>=65.0.0
```

This should prevent the issue in future installations.

---

## Verify Everything Works

After fixing, run these tests:

```powershell
# Test Django
python manage.py check

# Test imports
python -c "import rest_framework_simplejwt; print('JWT works!')"

# Run tests
python manage.py test

# Start server
python manage.py runserver
```

---

## Still Having Issues?

### Option 1: Fresh Install

```powershell
cd C:\Project\todo-django

# Remove old venv
Remove-Item -Recurse -Force venv

# Create new venv
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install everything
pip install setuptools
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Run server
python manage.py runserver
```

### Option 2: Use Docker (Easiest!)

If you have Docker installed:
```powershell
cd C:\Project\todo-django
docker-compose up --build
```

No Python version issues with Docker!

---

## Quick Commands

```powershell
# Navigate to project
cd C:\Project\todo-django

# Fix the issue
python -m pip install setuptools

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver

# Open browser
start http://localhost:8000
```

---

## Success Checklist

After running the fix:

- [ ] No errors when running `python manage.py check`
- [ ] Migrations completed successfully
- [ ] Server starts without errors
- [ ] Can access http://localhost:8000
- [ ] Can register a new user
- [ ] Can login
- [ ] Can create tasks

---

## What to Do Now

1. **Run the fix:**
   ```powershell
   cd C:\Project\todo-django
   python -m pip install setuptools
   ```

2. **Run migrations:**
   ```powershell
   python manage.py migrate
   ```

3. **Start the server:**
   ```powershell
   python manage.py runserver
   ```

4. **Visit the app:**
   http://localhost:8000

---

**The fix is simple: just install `setuptools`!**

```powershell
pip install setuptools
```

Then you're good to go! 🚀
