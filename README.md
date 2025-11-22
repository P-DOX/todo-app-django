# Django Todo App

A full-featured todo application built with Django and Django REST Framework, featuring calendar views, task management, user authentication, and recurring task templates.

## Features

- ✅ **User Authentication** - JWT-based authentication with registration and login
- 📅 **Calendar View** - Visual calendar with heatmap showing task completion
- 📝 **Task Management** - Create, edit, delete, and complete tasks
- 🔄 **Recurring Tasks** - Set up default tasks for specific weekdays
- 👥 **Multi-User Support** - Each user has their own tasks and defaults
- 🏷️ **Task Categories** - Personal and Work tabs for organization
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **Django Admin** - Built-in admin panel for advanced management

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Database**: SQLite (easily switchable to PostgreSQL)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **Containerization**: Docker + Docker Compose

## Project Structure

```
todo-django/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variables template
│
├── todo_project/           # Main project settings
│   ├── __init__.py
│   ├── settings.py         # Django settings
│   ├── urls.py            # Root URL configuration
│   ├── wsgi.py            # WSGI configuration
│   └── asgi.py            # ASGI configuration
│
├── tasks/                  # Tasks application
│   ├── models.py          # Task and DefaultTask models
│   ├── views.py           # API views and endpoints
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # App URL configuration
│   ├── admin.py           # Django admin configuration
│   └── apps.py
│
├── templates/              # HTML templates
│   ├── index.html         # Main todo app page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   └── admin.html         # Default tasks admin page
│
├── static/                 # Static files
│   ├── css/
│   │   └── styles.css     # Application styles
│   └── js/
│       ├── app.js         # Main application logic
│       ├── auth.js        # Authentication helpers
│       └── admin.js       # Admin page logic
│
└── data/                   # Database storage (auto-created)
    └── db.sqlite3         # SQLite database
```

## Quick Start

### Method 1: Local Installation

#### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

#### Steps

1. **Navigate to the project directory**
```powershell
cd C:\Project\todo-django
```

2. **Create a virtual environment**
```powershell
python -m venv venv
```

3. **Activate the virtual environment**
```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows Command Prompt
venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

4. **Install dependencies**
```powershell
pip install -r requirements.txt
```

5. **Create data directory**
```powershell
mkdir data
```

6. **Run migrations**
```powershell
python manage.py migrate
```

7. **Create a superuser (optional, for Django admin)**
```powershell
python manage.py createsuperuser
```

8. **Run the development server**
```powershell
python manage.py runserver
```

9. **Open your browser**
```
http://localhost:8000
```

### Method 2: Docker

#### Prerequisites
- Docker
- Docker Compose

#### Steps

1. **Navigate to the project directory**
```powershell
cd C:\Project\todo-django
```

2. **Build and run with Docker Compose**
```powershell
docker-compose up --build
```

3. **Open your browser**
```
http://localhost:8000
```

4. **To stop the containers**
```powershell
docker-compose down
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "username": "john",
    "password": "secret123"
  }
  ```

- `POST /api/auth/login` - Login and get JWT token
  ```json
  {
    "username": "john",
    "password": "secret123"
  }
  ```

- `GET /api/auth/exists` - Check if any users exist
- `GET /api/auth/me` - Get current user info (requires auth)

### Tasks

All task endpoints require authentication (Bearer token).

- `GET /api/tasks/` - List all tasks
  - Query params: `date` (YYYY-MM-DD), `tab` (personal/work)
  
- `POST /api/tasks/` - Create a new task
  ```json
  {
    "title": "Buy groceries",
    "date": "2025-11-22",
    "tab": "personal",
    "completed": false
  }
  ```

- `PUT /api/tasks/{id}/` - Update a task
- `DELETE /api/tasks/{id}/` - Delete a task
- `POST /api/tasks/sync/` - Sync all tasks (replace entire collection)
- `POST /api/tasks/cleanup/` - Remove old tasks

### Default Tasks

- `GET /api/defaults/` - List default tasks
- `POST /api/defaults/` - Create a default task
  ```json
  {
    "weekday": 1,
    "title": "Team meeting",
    "tab": "work"
  }
  ```

- `DELETE /api/defaults/{id}/` - Delete a default task
- `POST /api/defaults/apply/` - Apply defaults for a specific date
  ```json
  {
    "date": "2025-11-25",
    "tab": "personal"
  }
  ```

### Utility

- `GET /api/ping` - Health check

## Django Admin Panel

Access the Django admin panel for advanced management:

1. Create a superuser (if not already created):
```powershell
python manage.py createsuperuser
```

2. Navigate to:
```
http://localhost:8000/admin
```

3. Login with your superuser credentials

The admin panel allows you to:
- Manage all users
- View and edit all tasks
- Manage default tasks
- Filter and search tasks by date, user, status
- Bulk actions on tasks

## Usage Guide

### First Time Setup

1. **Register**: Visit `http://localhost:8000/register.html`
2. **Create your account**
3. **Login**: You'll be redirected to the main app

### Managing Tasks

1. **Add a task**: Type in the input field and click "Add"
2. **Complete a task**: Click the checkbox
3. **Edit a task**: Double-click the task title or click the edit icon
4. **Delete a task**: Click the trash icon
5. **Filter tasks**: Use "All", "Active", or "Completed" buttons
6. **Switch tabs**: Click "Personal" or "Work" tabs

### Using the Calendar

1. **View Calendar**: Click the "Calendar" view button
2. **Navigate months**: Use the ◀ and ▶ buttons
3. **Select a date**: Click any day to view tasks for that date
4. **Heat map**: Colors indicate task completion (green = more completed)

### Setting Up Default Tasks

1. **Access Admin**: Click "Create Default Tasks" link
2. **Add default**: Select weekday, enter title, choose tab
3. **Auto-creation**: Defaults are automatically created for matching days

## Environment Variables

Create a `.env` file from `.env.example`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Database

By default, SQLite is used. To switch to PostgreSQL:

1. Install psycopg2:
```powershell
pip install psycopg2-binary
```

2. Update `settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'todo_db',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## Development

### Running Tests
```powershell
python manage.py test
```

### Creating Migrations
```powershell
python manage.py makemigrations
python manage.py migrate
```

### Collecting Static Files
```powershell
python manage.py collectstatic
```

## Deployment

### Production Checklist

1. Set `DEBUG=False` in settings
2. Change `SECRET_KEY` to a secure random value
3. Update `ALLOWED_HOSTS` with your domain
4. Use a production database (PostgreSQL recommended)
5. Set up a web server (Nginx + Gunicorn)
6. Configure HTTPS
7. Set up static file serving
8. Configure CORS properly

### Gunicorn (Production Server)

```powershell
pip install gunicorn
gunicorn todo_project.wsgi:application --bind 0.0.0.0:8000
```

## Comparison with Node.js Version

| Feature | Node.js Version | Django Version |
|---------|----------------|----------------|
| Backend Code | ~400 lines | ~300 lines |
| Authentication | Custom JWT | Built-in + JWT |
| Database ORM | Raw SQL | Django ORM |
| Admin Panel | Custom HTML | Built-in Django Admin |
| User Management | Manual | Built-in |
| API Framework | Express | Django REST Framework |
| Security | Manual CORS, bcrypt | Built-in + CORS headers |

**Advantages of Django version:**
- Less code to maintain
- Built-in admin panel
- Better ORM with migrations
- More secure out of the box
- Easier user management
- Better scalability

## Troubleshooting

### Port already in use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Migration errors
```powershell
# Reset database (CAUTION: deletes all data)
Remove-Item data/db.sqlite3
python manage.py migrate
```

### Static files not loading
```powershell
python manage.py collectstatic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - Feel free to use this project for learning or commercial purposes.

## Support

For issues or questions:
- Check the troubleshooting section
- Review Django documentation: https://docs.djangoproject.com/
- Review DRF documentation: https://www.django-rest-framework.org/

## Acknowledgments

- Ported from the original Node.js/Express version
- Uses Django and Django REST Framework
- Inspired by modern todo applications

---

**Happy Task Managing! 📝✅**
