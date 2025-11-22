# 🚀 Quick Reference Guide

## One-Line Commands

### Start the App
```powershell
cd C:\Project\todo-django ; .\start.ps1
```

### With Manual Setup
```powershell
cd C:\Project\todo-django ; python -m venv venv ; .\venv\Scripts\Activate.ps1 ; pip install -r requirements.txt ; python manage.py migrate ; python manage.py runserver
```

### With Docker
```powershell
cd C:\Project\todo-django ; docker-compose up --build
```

---

## URLs at a Glance

| Page | URL | Description |
|------|-----|-------------|
| **Main App** | http://localhost:8000 | Todo application |
| **Login** | http://localhost:8000/login.html | User login |
| **Register** | http://localhost:8000/register.html | New user signup |
| **Admin Page** | http://localhost:8000/admin.html | Default tasks |
| **Django Admin** | http://localhost:8000/admin | Full admin panel |
| **API Root** | http://localhost:8000/api | API endpoints |

---

## API Endpoints Quick Reference

### Authentication (No Auth Required)
```
POST   /api/auth/register    Register new user
POST   /api/auth/login       Login and get token
GET    /api/auth/exists      Check if users exist
GET    /api/ping             Health check
```

### Tasks (Auth Required)
```
GET    /api/tasks/           List all tasks
POST   /api/tasks/           Create task
GET    /api/tasks/{id}/      Get specific task
PUT    /api/tasks/{id}/      Update task
DELETE /api/tasks/{id}/      Delete task
POST   /api/tasks/sync/      Sync all tasks
POST   /api/tasks/cleanup/   Remove old tasks
```

### Default Tasks (Auth Required)
```
GET    /api/defaults/        List defaults
POST   /api/defaults/        Create default
DELETE /api/defaults/{id}/   Delete default
POST   /api/defaults/apply/  Apply to date
```

---

## Common Commands

### Database
```powershell
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (WARNING: deletes all data!)
Remove-Item data\db.sqlite3 ; python manage.py migrate
```

### User Management
```powershell
# Create superuser
python manage.py createsuperuser

# Change user password
python manage.py changepassword <username>
```

### Development
```powershell
# Run server
python manage.py runserver

# Run on different port
python manage.py runserver 8080

# Run tests
python manage.py test

# Django shell
python manage.py shell
```

### Static Files
```powershell
# Collect static files
python manage.py collectstatic

# Clear collected files
Remove-Item -Recurse staticfiles
```

---

## File Locations

| What | Where |
|------|-------|
| **Database** | `C:\Project\todo-django\data\db.sqlite3` |
| **Settings** | `C:\Project\todo-django\todo_project\settings.py` |
| **Models** | `C:\Project\todo-django\tasks\models.py` |
| **Views** | `C:\Project\todo-django\tasks\views.py` |
| **Templates** | `C:\Project\todo-django\templates\` |
| **Static Files** | `C:\Project\todo-django\static\` |
| **Tests** | `C:\Project\todo-django\tasks\tests.py` |

---

## Troubleshooting Quick Fixes

### Port 8000 already in use
```powershell
netstat -ano | findstr :8000
# Note the PID and:
taskkill /PID <PID> /F
```

### Virtual environment not activating
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

### Static files not loading
```powershell
python manage.py collectstatic --noinput
```

### Database locked error
```powershell
# Close all connections, then:
Remove-Item data\db.sqlite3-wal
Remove-Item data\db.sqlite3-shm
```

### Module not found
```powershell
pip install -r requirements.txt
```

### Migration errors
```powershell
# Last resort - reset migrations
Remove-Item tasks\migrations\0*.py
python manage.py makemigrations
python manage.py migrate
```

---

## Environment Variables

Create `.env` file with:
```env
SECRET_KEY=your-long-random-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

Generate secret key:
```python
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test\",\"password\":\"test123\"}"
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test\",\"password\":\"test123\"}"
```

### Create Task
```bash
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"title\":\"Test\",\"date\":\"2025-11-22\",\"tab\":\"personal\"}"
```

### List Tasks
```bash
curl http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Python Django Shell Examples

```python
# Start shell
python manage.py shell

# Import models
from tasks.models import Task, DefaultTask
from django.contrib.auth.models import User

# Create user
user = User.objects.create_user('testuser', password='test123')

# Create task
task = Task.objects.create(
    user=user,
    title='Test Task',
    date='2025-11-22',
    tab='personal'
)

# Query tasks
Task.objects.filter(user=user)
Task.objects.filter(date='2025-11-22')
Task.objects.filter(completed=False)

# Update task
task.completed = True
task.save()

# Delete task
task.delete()
```

---

## Docker Commands

```powershell
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Remove volumes (deletes data!)
docker-compose down -v
```

---

## Performance Tips

### Database Optimization
```python
# Use select_related for foreign keys
Task.objects.select_related('user')

# Use prefetch_related for reverse relations
User.objects.prefetch_related('tasks')

# Add indexes in models
class Meta:
    indexes = [
        models.Index(fields=['date', 'tab']),
    ]
```

### Query Optimization
```python
# Bad - N+1 queries
for task in Task.objects.all():
    print(task.user.username)

# Good - 1 query
for task in Task.objects.select_related('user'):
    print(task.user.username)
```

---

## Security Checklist

Before deploying to production:

- [ ] Set `DEBUG=False`
- [ ] Change `SECRET_KEY`
- [ ] Update `ALLOWED_HOSTS`
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set up HTTPS
- [ ] Configure CORS properly
- [ ] Use environment variables
- [ ] Enable security middleware
- [ ] Set up logging
- [ ] Use strong passwords
- [ ] Regular backups
- [ ] Update dependencies

---

## Backup & Restore

### Backup Database
```powershell
# SQLite
Copy-Item data\db.sqlite3 backups\db-backup-$(Get-Date -Format 'yyyy-MM-dd').sqlite3

# Export to JSON
python manage.py dumpdata > backup.json
```

### Restore Database
```powershell
# SQLite
Copy-Item backups\db-backup.sqlite3 data\db.sqlite3

# Import from JSON
python manage.py loaddata backup.json
```

---

## Useful Django Management Commands

```powershell
# Show all URLs
python manage.py show_urls

# Check for problems
python manage.py check

# SQL for migrations
python manage.py sqlmigrate tasks 0001

# Database shell
python manage.py dbshell

# Clear cache
python manage.py clear_cache

# Create app
python manage.py startapp myapp
```

---

## IDE Integration

### VS Code
Recommended extensions:
- Python
- Django
- SQLite Viewer
- REST Client

### Settings (`.vscode/settings.json`)
```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black"
}
```

---

## Resources

- **Django Docs**: https://docs.djangoproject.com/
- **DRF Docs**: https://www.django-rest-framework.org/
- **JWT Docs**: https://django-rest-framework-simplejwt.readthedocs.io/
- **Django Admin**: https://docs.djangoproject.com/en/stable/ref/contrib/admin/

---

## 🎉 Quick Win Checklist

✅ Navigate to `C:\Project\todo-django`
✅ Run `.\start.ps1`
✅ Visit http://localhost:8000
✅ Register a user
✅ Create some tasks
✅ Check out the calendar view
✅ Visit Django admin at http://localhost:8000/admin
✅ Create default tasks
✅ Run tests: `python manage.py test`
✅ Read the full README.md

---

**You're all set! Happy coding! 🚀**
