# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All API requests (except auth endpoints and ping) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-token-here>
```

---

## Auth Endpoints

### 1. Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response (201 Created):**
```json
{
  "ok": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

---

### 2. Login User
**POST** `/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe"
  }
}
```

---

### 3. Check Users Exist
**GET** `/auth/exists`

Check if any users are registered in the system.

**Response (200 OK):**
```json
{
  "exists": true
}
```

---

### 4. Get Current User
**GET** `/auth/me`

Get information about the currently authenticated user.

**Headers Required:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe"
}
```

---

## Task Endpoints

### 5. List Tasks
**GET** `/tasks/`

Get all tasks for the authenticated user.

**Query Parameters:**
- `date` (optional): Filter by date (YYYY-MM-DD format)
- `tab` (optional): Filter by tab (personal or work)

**Example:**
```
GET /api/tasks/?date=2025-11-22&tab=personal
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "completed": false,
    "date": "2025-11-22",
    "tab": "personal",
    "created_at": "2025-11-22T10:30:00Z",
    "last_modified": "2025-11-22T10:30:00Z"
  },
  {
    "id": 2,
    "title": "Team meeting",
    "completed": true,
    "date": "2025-11-22",
    "tab": "work",
    "created_at": "2025-11-22T09:00:00Z",
    "last_modified": "2025-11-22T14:00:00Z"
  }
]
```

---

### 6. Create Task
**POST** `/tasks/`

Create a new task.

**Request Body:**
```json
{
  "title": "Complete Django tutorial",
  "date": "2025-11-23",
  "tab": "personal",
  "completed": false
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "title": "Complete Django tutorial",
  "completed": false,
  "date": "2025-11-23",
  "tab": "personal",
  "created_at": "2025-11-22T15:30:00Z",
  "last_modified": "2025-11-22T15:30:00Z"
}
```

---

### 7. Update Task
**PUT** `/tasks/{id}/`

Update an existing task.

**Request Body:**
```json
{
  "title": "Complete Django tutorial (updated)",
  "completed": true
}
```

**Response (200 OK):**
```json
{
  "id": 3,
  "title": "Complete Django tutorial (updated)",
  "completed": true,
  "date": "2025-11-23",
  "tab": "personal",
  "created_at": "2025-11-22T15:30:00Z",
  "last_modified": "2025-11-22T16:00:00Z"
}
```

---

### 8. Delete Task
**DELETE** `/tasks/{id}/`

Delete a task.

**Response (204 No Content)**

---

### 9. Sync Tasks
**POST** `/tasks/sync/`

Replace all user tasks with the provided list. Useful for client-side sync.

**Request Body:**
```json
[
  {
    "title": "Task 1",
    "date": "2025-11-22",
    "tab": "personal",
    "completed": false
  },
  {
    "title": "Task 2",
    "date": "2025-11-22",
    "tab": "work",
    "completed": true
  }
]
```

**Response (200 OK):**
```json
{
  "ok": true,
  "count": 2
}
```

---

### 10. Cleanup Old Tasks
**POST** `/tasks/cleanup/`

Remove tasks older than the specified number of days.

**Request Body:**
```json
{
  "days": 365
}
```

**Response (200 OK):**
```json
{
  "deleted": 15
}
```

---

## Default Task Endpoints

### 11. List Default Tasks
**GET** `/defaults/`

Get all default task templates for the user.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "weekday": 1,
    "weekday_display": "Monday",
    "title": "Team standup",
    "tab": "work",
    "created_at": "2025-11-20T10:00:00Z"
  }
]
```

---

### 12. Create Default Task
**POST** `/defaults/`

Create a new default task template.

**Request Body:**
```json
{
  "weekday": 5,
  "title": "Weekly review",
  "tab": "personal"
}
```

**Weekday values:**
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

**Response (201 Created):**
```json
{
  "id": 2,
  "weekday": 5,
  "weekday_display": "Friday",
  "title": "Weekly review",
  "tab": "personal",
  "created_at": "2025-11-22T16:00:00Z"
}
```

---

### 13. Delete Default Task
**DELETE** `/defaults/{id}/`

Delete a default task template.

**Response (204 No Content)**

---

### 14. Apply Defaults
**POST** `/defaults/apply/`

Create tasks from default templates for a specific date.

**Request Body:**
```json
{
  "date": "2025-11-25",
  "tab": "personal"
}
```

**Response (200 OK):**
```json
{
  "created": 3
}
```

---

## Utility Endpoints

### 15. Health Check
**GET** `/ping`

Check if the API is responding.

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
  "error": "Description of what went wrong"
}
```

**401 Unauthorized:**
```json
{
  "error": "unauthenticated"
}
```

**404 Not Found:**
```json
{
  "error": "not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error description"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Create Task
```bash
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"New task","date":"2025-11-22","tab":"personal"}'
```

### List Tasks
```bash
curl -X GET "http://localhost:8000/api/tasks/?date=2025-11-22" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
