from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model, login as auth_login
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from datetime import datetime, timedelta
from .models import Task, DefaultTask, WeeklyTask, MonthlyTask, YearlyTask
from .serializers import (
    TaskSerializer, 
    DefaultTaskSerializer,
    WeeklyTaskSerializer,
    MonthlyTaskSerializer,
    YearlyTaskSerializer,
    UserRegistrationSerializer,
    UserSerializer
)

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    Automatically filters tasks by the authenticated user.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter tasks by authenticated user and optional date parameter.
        """
        queryset = Task.objects.filter(user=self.request.user)
        
        # Optional date filter
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(date=target_date)
            except ValueError:
                pass
        
        # Optional tab filter
        tab = self.request.query_params.get('tab')
        if tab:
            queryset = queryset.filter(tab=tab)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the user when creating a task.
        """
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """
        Sync endpoint: Replace all tasks with the provided list.
        Mimics the Node.js /api/sync endpoint.
        """
        tasks_data = request.data
        
        if not isinstance(tasks_data, list):
            return Response(
                {'error': 'expected array'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing tasks for this user
        Task.objects.filter(user=request.user).delete()
        
        # Create new tasks
        created_tasks = []
        for task_data in tasks_data:
            # Remove 'id' if present (we'll generate new ones)
            task_data.pop('id', None)
            serializer = self.get_serializer(data=task_data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                created_tasks.append(serializer.data)
        
        return Response({'ok': True, 'count': len(created_tasks)})
    
    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """
        Clean up old tasks (older than retention period).
        """
        days = int(request.data.get('days', 365))
        deleted_count = Task.cleanup_old_tasks(request.user, days)
        return Response({'deleted': deleted_count})


class DefaultTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for DefaultTask CRUD operations.
    """
    serializer_class = DefaultTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter default tasks by authenticated user.
        """
        return DefaultTask.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """
        Set the user when creating a default task.
        """
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def apply(self, request):
        """
        Apply default tasks for a specific date or batch of dates.
        Supports both single date and batch processing.
        """
        date_str = request.data.get('date')
        dates = request.data.get('dates')  # Array of dates for batch processing
        tab = request.data.get('tab', 'personal')
        
        # Batch processing
        if dates:
            if not isinstance(dates, list):
                return Response(
                    {'error': 'dates must be an array'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            total_created = 0
            for date_item in dates:
                try:
                    target_date = datetime.strptime(date_item, '%Y-%m-%d').date()
                    created_count = DefaultTask.apply_defaults_for_date(
                        request.user, 
                        target_date, 
                        tab
                    )
                    total_created += created_count
                except ValueError:
                    continue  # Skip invalid dates
            
            return Response({'created': total_created})
        
        # Single date processing (backward compatibility)
        if not date_str:
            return Response(
                {'error': 'date or dates required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'invalid date format, use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_count = DefaultTask.apply_defaults_for_date(
            request.user, 
            target_date, 
            tab
        )
        
        return Response({'created': created_count})


class WeeklyTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for WeeklyTask CRUD operations.
    """
    serializer_class = WeeklyTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter weekly tasks by authenticated user and optional week parameter.
        """
        queryset = WeeklyTask.objects.filter(user=self.request.user)
        
        # Optional week filter
        week_start = self.request.query_params.get('week_start')
        if week_start:
            try:
                target_date = datetime.strptime(week_start, '%Y-%m-%d').date()
                queryset = queryset.filter(week_start_date=target_date)
            except ValueError:
                pass
        
        # Optional tab filter
        tab = self.request.query_params.get('tab')
        if tab:
            queryset = queryset.filter(tab=tab)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the user when creating a weekly task.
        """
        serializer.save(user=self.request.user)


class MonthlyTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MonthlyTask CRUD operations.
    """
    serializer_class = MonthlyTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter monthly tasks by authenticated user and optional month/year parameters.
        """
        queryset = MonthlyTask.objects.filter(user=self.request.user)
        
        # Optional month filter
        month = self.request.query_params.get('month')
        if month:
            try:
                queryset = queryset.filter(month=int(month))
            except ValueError:
                pass
        
        # Optional year filter
        year = self.request.query_params.get('year')
        if year:
            try:
                queryset = queryset.filter(year=int(year))
            except ValueError:
                pass
        
        # Optional tab filter
        tab = self.request.query_params.get('tab')
        if tab:
            queryset = queryset.filter(tab=tab)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the user when creating a monthly task.
        """
        serializer.save(user=self.request.user)


class YearlyTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for YearlyTask CRUD operations.
    """
    serializer_class = YearlyTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter yearly tasks by authenticated user and optional year/category parameters.
        """
        queryset = YearlyTask.objects.filter(user=self.request.user)
        
        # Optional year filter
        year = self.request.query_params.get('year')
        if year:
            try:
                queryset = queryset.filter(year=int(year))
            except ValueError:
                pass
        
        # Optional category filter
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Set the user when creating a yearly task.
        """
        serializer.save(user=self.request.user)


# Authentication views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user and return JWT tokens.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'ok': True,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'ok': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    Login user and return JWT tokens.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'username and password required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'ok': True,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    
    return Response(
        {'error': 'invalid credentials'}, 
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def check_users_exist(request):
    """
    Check if any users exist in the system.
    Used by frontend to determine if registration is needed.
    """
    user_count = User.objects.count()
    return Response({'exists': user_count > 0})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user information.
    """
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    """
    Health check endpoint.
    """
    return Response({'ok': True})


# Server-side form handlers
@require_http_methods(["GET", "POST"])
def login_view(request):
    """
    Server-side login handler.
    """
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        
        if not username or not password:
            return render(request, 'login.html', {'error': 'Username and password are required'})
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Create JWT token
            refresh = RefreshToken.for_user(user)
            # Add custom claims
            refresh['first_name'] = user.first_name if hasattr(user, 'first_name') else ''
            refresh['username'] = user.username
            token = str(refresh.access_token)
            refresh['first_name'] = user.first_name if hasattr(user, 'first_name') else ''
            refresh['username'] = user.username
            token = str(refresh.access_token)
            
            # Return HTML that sets both cookie and localStorage, then redirects
            html = f'''
            <!DOCTYPE html>
            <html>
            <head><title>Redirecting...</title></head>
            <body>
                <script>
                    localStorage.setItem('todo.auth.token', '{token}');
                    window.location.href = '/';
                </script>
                <p>Redirecting...</p>
            </body>
            </html>
            '''
            response = HttpResponse(html)
            response.set_cookie(
                'auth_token', 
                token,
                httponly=False,  # Changed to False so JavaScript can read it
                secure=False,
                samesite='Lax',
                max_age=7*24*60*60
            )
            return response
        else:
            return render(request, 'login.html', {'error': 'Invalid username or password'})
    
    return render(request, 'login.html')


@require_http_methods(["GET", "POST"])
def register_view(request):
    """
    Server-side registration handler.
    """
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        email = request.POST.get('email', '').strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        
        # Validation
        errors = []
        if not username:
            errors.append('Username is required')
        if not password:
            errors.append('Password is required')
        if len(password) < 4:
            errors.append('Password must be at least 4 characters')
        if not email:
            errors.append('Email is required')
        if not first_name:
            errors.append('First name is required')
        if not last_name:
            errors.append('Last name is required')
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            errors.append('Username already exists')
        
        # Check if email exists
        if User.objects.filter(email=email).exists():
            errors.append('Email already exists')
        
        if errors:
            return render(request, 'register.html', {
                'error': ' | '.join(errors),
                'username': username,
                'email': email,
                'first_name': first_name,
                'last_name': last_name
            })
        
        # Create user
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create JWT token and log them in
            refresh = RefreshToken.for_user(user)
            token = str(refresh.access_token)
            
            # Return HTML that sets both cookie and localStorage, then redirects
            html = f'''
            <!DOCTYPE html>
            <html>
            <head><title>Redirecting...</title></head>
            <body>
                <script>
                    localStorage.setItem('todo.auth.token', '{token}');
                    window.location.href = '/';
                </script>
                <p>Redirecting...</p>
            </body>
            </html>
            '''
            response = HttpResponse(html)
            response.set_cookie(
                'auth_token', 
                token,
                httponly=False,  # Changed to False so JavaScript can read it
                secure=False,
                samesite='Lax',
                max_age=7*24*60*60
            )
            return response
        except Exception as e:
            return render(request, 'register.html', {'error': f'Registration failed: {str(e)}'})
    
    return render(request, 'register.html')
