from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import Task, DefaultTask

User = get_user_model()


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin for the custom user model with extended fields."""
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'email_verified', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('phone', 'date_of_birth', 'bio', 'profile_picture', 'email_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'completed', 'tab', 'user', 'created_at']
    list_filter = ['completed', 'tab', 'date', 'user']
    search_fields = ['title', 'user__username', 'user__email']
    date_hierarchy = 'date'
    list_editable = ['completed']
    readonly_fields = ['created_at', 'last_modified']
    
    fieldsets = (
        ('Task Information', {
            'fields': ('user', 'title', 'completed', 'date', 'tab')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_modified'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)


@admin.register(DefaultTask)
class DefaultTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'weekday', 'tab', 'user', 'get_weekday_display']
    list_filter = ['weekday', 'tab', 'user']
    search_fields = ['title', 'user__username', 'user__email']
    
    fieldsets = (
        ('Default Task Information', {
            'fields': ('user', 'weekday', 'title', 'tab')
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(user=request.user)
