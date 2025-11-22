from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'defaults', views.DefaultTaskViewSet, basename='default-task')
router.register(r'weekly-tasks', views.WeeklyTaskViewSet, basename='weekly-task')
router.register(r'monthly-tasks', views.MonthlyTaskViewSet, basename='monthly-task')
router.register(r'yearly-tasks', views.YearlyTaskViewSet, basename='yearly-task')

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/register', views.register_user, name='register'),
    path('auth/login', views.login_user, name='login'),
    path('auth/exists', views.check_users_exist, name='check-users'),
    path('auth/me', views.current_user, name='current-user'),
    
    # Utility endpoints
    path('ping', views.ping, name='ping'),
]
