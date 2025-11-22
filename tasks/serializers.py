from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task, DefaultTask, WeeklyTask, MonthlyTask, YearlyTask
from . import models

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with extended fields.
    """
    password = serializers.CharField(write_only=True, min_length=4)
    
    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'phone', 'date_of_birth']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        """Check that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            date_of_birth=validated_data.get('date_of_birth', None),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user information.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'date_of_birth', 'bio', 'created_at']
        read_only_fields = ['id', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model.
    Automatically sets the user from the request context.
    """
    class Meta:
        model = Task
        fields = ['id', 'title', 'completed', 'date', 'tab', 'created_at', 'last_modified']
        read_only_fields = ['id', 'created_at', 'last_modified']
    
    def create(self, validated_data):
        # User is added from the view
        return super().create(validated_data)


class DefaultTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for DefaultTask model.
    """
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    
    class Meta:
        model = DefaultTask
        fields = ['id', 'weekday', 'weekday_display', 'title', 'tab', 'created_at']
        read_only_fields = ['id', 'created_at']


class WeeklyTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for WeeklyTask model.
    """
    week_end_date = serializers.DateField(read_only=True)
    
    class Meta:
        model = models.WeeklyTask
        fields = ['id', 'title', 'completed', 'week_start_date', 'week_end_date', 'tab', 'created_at', 'last_modified']
        read_only_fields = ['id', 'created_at', 'last_modified']


class MonthlyTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for MonthlyTask model.
    """
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = models.MonthlyTask
        fields = ['id', 'title', 'completed', 'month', 'year', 'tab', 'priority', 'priority_display', 'created_at', 'last_modified']
        read_only_fields = ['id', 'created_at', 'last_modified']


class YearlyTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for YearlyTask model.
    """
    quarter_display = serializers.CharField(source='get_quarter_display', read_only=True)
    
    class Meta:
        model = models.YearlyTask
        fields = ['id', 'title', 'completed', 'year', 'quarter', 'quarter_display', 'created_at', 'last_modified']
        read_only_fields = ['id', 'created_at', 'last_modified']
