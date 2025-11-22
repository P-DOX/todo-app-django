"""
URL configuration for todo_project project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from tasks import views as task_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    
    # Server-side form handlers
    path('login.html', task_views.login_view, name='login'),
    path('register.html', task_views.register_view, name='register'),
    
    # Serve frontend pages
    path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('admin.html', TemplateView.as_view(template_name='admin.html'), name='admin_page'),
]
