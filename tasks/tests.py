# tasks/tests.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from .models import Task, DefaultTask


class TaskAPITestCase(TestCase):
    """Test cases for Task API endpoints"""
    
    def setUp(self):
        """Set up test client and create test user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Get JWT token
        response = self.client.post('/api/auth/login', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_create_task(self):
        """Test creating a new task"""
        data = {
            'title': 'Test Task',
            'date': '2025-11-22',
            'tab': 'personal',
            'completed': False
        }
        response = self.client.post('/api/tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.first().title, 'Test Task')
    
    def test_list_tasks(self):
        """Test listing tasks"""
        Task.objects.create(
            user=self.user,
            title='Task 1',
            date='2025-11-22',
            tab='personal'
        )
        Task.objects.create(
            user=self.user,
            title='Task 2',
            date='2025-11-22',
            tab='work'
        )
        
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_filter_tasks_by_date(self):
        """Test filtering tasks by date"""
        Task.objects.create(
            user=self.user,
            title='Today Task',
            date='2025-11-22',
            tab='personal'
        )
        Task.objects.create(
            user=self.user,
            title='Tomorrow Task',
            date='2025-11-23',
            tab='personal'
        )
        
        response = self.client.get('/api/tasks/?date=2025-11-22')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Today Task')
    
    def test_update_task(self):
        """Test updating a task"""
        task = Task.objects.create(
            user=self.user,
            title='Original Title',
            date='2025-11-22',
            tab='personal',
            completed=False
        )
        
        data = {'completed': True}
        response = self.client.put(f'/api/tasks/{task.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        task.refresh_from_db()
        self.assertTrue(task.completed)
    
    def test_delete_task(self):
        """Test deleting a task"""
        task = Task.objects.create(
            user=self.user,
            title='Task to Delete',
            date='2025-11-22',
            tab='personal'
        )
        
        response = self.client.delete(f'/api/tasks/{task.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.count(), 0)


class AuthAPITestCase(TestCase):
    """Test cases for Authentication API endpoints"""
    
    def setUp(self):
        """Set up test client"""
        self.client = APIClient()
    
    def test_register_user(self):
        """Test user registration"""
        data = {
            'username': 'newuser',
            'password': 'newpass123'
        }
        response = self.client.post('/api/auth/register', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(User.objects.count(), 1)
    
    def test_login_user(self):
        """Test user login"""
        User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post('/api/auth/login', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
    
    def test_check_users_exist(self):
        """Test checking if users exist"""
        response = self.client.get('/api/auth/exists')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['exists'])
        
        User.objects.create_user(username='user1', password='pass')
        
        response = self.client.get('/api/auth/exists')
        self.assertTrue(response.data['exists'])


class DefaultTaskTestCase(TestCase):
    """Test cases for DefaultTask model and API"""
    
    def setUp(self):
        """Set up test client and create test user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Get JWT token
        response = self.client.post('/api/auth/login', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_create_default_task(self):
        """Test creating a default task"""
        data = {
            'weekday': 1,  # Monday
            'title': 'Weekly Meeting',
            'tab': 'work'
        }
        response = self.client.post('/api/defaults/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DefaultTask.objects.count(), 1)
    
    def test_apply_defaults(self):
        """Test applying default tasks to a date"""
        # Create a default task for Monday (weekday=1)
        DefaultTask.objects.create(
            user=self.user,
            weekday=1,
            title='Monday Task',
            tab='personal'
        )
        
        # Apply defaults for a Monday (2025-11-24 is a Monday)
        data = {
            'date': '2025-11-24',
            'tab': 'personal'
        }
        response = self.client.post('/api/defaults/apply/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 1)
        
        # Verify task was created
        self.assertEqual(Task.objects.count(), 1)
        task = Task.objects.first()
        self.assertEqual(task.title, 'Monday Task')
