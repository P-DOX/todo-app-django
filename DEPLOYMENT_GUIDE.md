# Todo App - Multi-Device Deployment Guide

This guide will help you set up the Todo application on any device (Windows, Mac, Linux, or cloud servers).

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Python 3.8+** installed ([Download Python](https://www.python.org/downloads/))
- **Git** installed ([Download Git](https://git-scm.com/downloads))
- Basic command line knowledge
- (Optional) **Docker** for containerized deployment

---

## 🚀 Method 1: Quick Setup (Recommended for New Devices)

### Step 1: Clone or Download the Project

#### Option A: Using Git
```bash
git clone <your-repository-url>
cd todo-django
```

#### Option B: Manual Download
1. Download the project ZIP file
2. Extract to your desired location
3. Open terminal/command prompt in that folder

### Step 2: Run the Automated Setup Script

#### Windows (PowerShell)
```powershell
# Run the setup script
.\setup.ps1

# If you get execution policy error, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Linux/Mac (Bash)
```bash
# Make script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

The setup script will automatically:
- ✅ Create virtual environment
- ✅ Install all dependencies
- ✅ Create database directory
- ✅ Run migrations
- ✅ Start the server

### Step 3: Access the Application

Open your browser and go to:
```
http://localhost:8000
```

---

## 🔧 Method 2: Manual Setup (Step-by-Step)

### Windows

```powershell
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create data directory
mkdir data -Force

# 5. Run migrations
python manage.py migrate

# 6. Start server
python manage.py runserver
```

### Mac/Linux

```bash
# 1. Create virtual environment
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create data directory
mkdir -p data

# 5. Run migrations
python manage.py migrate

# 6. Start server
python manage.py runserver
```

---

## 🐳 Method 3: Docker Deployment

Perfect for consistent deployment across any device!

### Prerequisites
- Install Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Install Docker Compose (included with Docker Desktop)

### Setup

```bash
# 1. Navigate to project directory
cd todo-django

# 2. Build and start containers
docker-compose up --build

# 3. Access the app
# Open browser: http://localhost:8000

# 4. To stop
# Press Ctrl+C, then:
docker-compose down
```

### Benefits of Docker
- ✅ No Python installation needed
- ✅ Same environment everywhere
- ✅ Easy to update and redeploy
- ✅ Isolated from system

---

## 🌐 Method 4: Cloud Deployment

### Deploy to Heroku

1. **Install Heroku CLI** ([Download](https://devcenter.heroku.com/articles/heroku-cli))

2. **Prepare for deployment**
```bash
# Create Procfile (already included)
# Create runtime.txt (already included)
```

3. **Deploy**
```bash
heroku login
heroku create your-todo-app-name
git push heroku main
heroku run python manage.py migrate
heroku open
```

### Deploy to Railway

1. Visit [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects Django and deploys
5. Add environment variables in Railway dashboard

### Deploy to DigitalOcean

1. Create a Droplet (Ubuntu 22.04)
2. SSH into the server
3. Run the setup script:
```bash
# Download setup script
wget https://your-repo/setup.sh
chmod +x setup.sh
./setup.sh

# Install nginx and configure
sudo apt install nginx
sudo nano /etc/nginx/sites-available/todo
```

---

## 📱 Accessing from Other Devices (Same Network)

### Step 1: Find Your IP Address

#### Windows
```powershell
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

#### Mac/Linux
```bash
ifconfig
# or
ip addr show
```

### Step 2: Update Django Settings

Edit `todo_project/settings.py`:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '192.168.1.100', '*']
```

### Step 3: Run Server on All Interfaces
```bash
python manage.py runserver 0.0.0.0:8000
```

### Step 4: Access from Other Devices
On other devices (phone, tablet, etc.) on the same network:
```
http://192.168.1.100:8000
```

---

## 🔐 Production Deployment Checklist

When deploying to production (public internet):

### 1. Security Settings

Edit `todo_project/settings.py`:
```python
# Turn off debug mode
DEBUG = False

# Set allowed hosts
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Use environment variables for secrets
SECRET_KEY = os.environ.get('SECRET_KEY')

# Enable HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 2. Database

Switch to PostgreSQL:
```bash
pip install psycopg2-binary
```

Update `settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': '5432',
    }
}
```

### 3. Static Files

```bash
# Install whitenoise for serving static files
pip install whitenoise

# Collect static files
python manage.py collectstatic --noinput
```

### 4. Production Server

```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn todo_project.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### 5. Web Server (Nginx)

Create `/etc/nginx/sites-available/todo`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /path/to/todo-django/staticfiles/;
    }
}
```

---

## 🔄 Syncing Data Between Devices

The app uses JWT authentication, so your data is tied to your account.

### Option 1: Use the Same Database
- Deploy to a cloud server
- All devices connect to the same server
- Data syncs automatically

### Option 2: Export/Import (Manual)
```bash
# Export data from device 1
python manage.py dumpdata tasks.Task > tasks_backup.json

# Import data to device 2
python manage.py loaddata tasks_backup.json
```

### Option 3: Use Cloud Database
- Set up PostgreSQL on cloud (AWS RDS, DigitalOcean, etc.)
- Update `DATABASES` setting on all devices
- All devices share the same data

---

## 🛠️ Troubleshooting

### Port Already in Use

#### Windows
```powershell
# Find process
netstat -ano | findstr :8000

# Kill process (replace <PID>)
taskkill /PID <PID> /F
```

#### Mac/Linux
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

### Virtual Environment Issues

```bash
# Delete and recreate
rm -rf venv  # or Remove-Item venv -Recurse on Windows
python -m venv venv
```

### Database Issues

```bash
# Reset database (CAUTION: deletes all data!)
rm data/db.sqlite3  # or Remove-Item data/db.sqlite3 on Windows
python manage.py migrate
```

### Permission Errors (Linux/Mac)

```bash
# Fix permissions
chmod +x setup.sh
chmod +x manage.py
```

### Module Not Found

```bash
# Ensure virtual environment is activated
# Then reinstall dependencies
pip install -r requirements.txt
```

---

## 📦 Backup & Restore

### Backup

```bash
# Backup database
cp data/db.sqlite3 backup_$(date +%Y%m%d).db

# Backup everything
tar -czf todo-backup.tar.gz data/ venv/ static/
```

### Restore

```bash
# Restore database
cp backup_20251122.db data/db.sqlite3

# Restore full backup
tar -xzf todo-backup.tar.gz
```

---

## 🔄 Updating the App

```bash
# 1. Pull latest changes
git pull origin main

# 2. Activate virtual environment
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows

# 3. Update dependencies
pip install -r requirements.txt

# 4. Run migrations
python manage.py migrate

# 5. Collect static files (if changed)
python manage.py collectstatic --noinput

# 6. Restart server
```

---

## 📞 Support

### Common Commands Reference

```bash
# Start server
python manage.py runserver

# Create superuser (admin access)
python manage.py createsuperuser

# Run migrations
python manage.py migrate

# Make new migrations
python manage.py makemigrations

# Open Django shell
python manage.py shell

# Run tests
python manage.py test
```

### File Locations

- **Database**: `data/db.sqlite3`
- **Static files**: `static/`
- **Templates**: `templates/`
- **Settings**: `todo_project/settings.py`
- **Main app**: `tasks/`

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| First-time setup | `python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python manage.py migrate` |
| Start server | `python manage.py runserver` |
| Stop server | `Ctrl+C` |
| Create admin user | `python manage.py createsuperuser` |
| Access admin panel | `http://localhost:8000/admin` |
| Access app | `http://localhost:8000` |
| Reset database | `rm data/db.sqlite3 && python manage.py migrate` |

---

**🎉 You're all set! Your Todo app should now work on any device.**
