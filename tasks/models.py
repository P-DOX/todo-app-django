from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from datetime import datetime, timedelta


class CustomUser(AbstractUser):
    """
    Extended User model with additional fields.
    Extends Django's built-in User model.
    """
    # Override to make fields required
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, help_text='Email address (must be unique)')
    
    # Additional fields
    phone = models.CharField(max_length=20, blank=True, help_text='Phone number')
    date_of_birth = models.DateField(null=True, blank=True, help_text='Date of birth')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, help_text='Short bio')
    
    # Account settings
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name or self.username
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name or self.username


class Task(models.Model):
    """
    Task model - represents a todo item for a specific date.
    """
    TAB_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    date = models.DateField(help_text='The date this task is scheduled for')
    tab = models.CharField(max_length=20, choices=TAB_CHOICES, default='personal')
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'date', 'tab']),
            models.Index(fields=['user', 'date']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.date})"
    
    @classmethod
    def cleanup_old_tasks(cls, user, days=365):
        """
        Remove tasks older than the specified number of days.
        Mimics the retention policy from the Node.js version.
        """
        cutoff_date = datetime.now().date() - timedelta(days=days)
        deleted_count, _ = cls.objects.filter(
            user=user,
            date__lt=cutoff_date
        ).delete()
        return deleted_count


class DefaultTask(models.Model):
    """
    Default task template that gets created automatically for specific weekdays.
    """
    WEEKDAY_CHOICES = [
        (0, 'Sunday'),
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
    ]
    
    TAB_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='default_tasks')
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    title = models.CharField(max_length=500)
    tab = models.CharField(max_length=20, choices=TAB_CHOICES, default='personal')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'weekday', 'title', 'tab']
        ordering = ['weekday', 'title']
    
    def __str__(self):
        return f"{self.get_weekday_display()}: {self.title} ({self.tab})"
    
    @classmethod
    def apply_defaults_for_date(cls, user, target_date, tab='personal'):
        """
        Create default tasks for a specific date if they don't already exist.
        Returns the number of tasks created.
        """
        weekday = target_date.weekday()
        # Convert Python weekday (0=Monday) to our format (0=Sunday)
        # Python: Mon=0, Tue=1, ..., Sun=6
        # Ours: Sun=0, Mon=1, ..., Sat=6
        weekday_adjusted = (weekday + 1) % 7
        
        defaults = cls.objects.filter(
            user=user,
            weekday=weekday_adjusted,
            tab=tab
        )
        
        created_count = 0
        for default in defaults:
            # Check if task already exists
            exists = Task.objects.filter(
                user=user,
                date=target_date,
                title=default.title,
                tab=default.tab
            ).exists()
            
            if not exists:
                Task.objects.create(
                    user=user,
                    title=default.title,
                    date=target_date,
                    tab=default.tab,
                    completed=False
                )
                created_count += 1
        
        return created_count


class WeeklyTask(models.Model):
    """
    Weekly task/goal - represents a task for an entire week.
    """
    TAB_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weekly_tasks')
    title = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    week_start_date = models.DateField(help_text='Monday of the week (ISO week start)')
    tab = models.CharField(max_length=20, choices=TAB_CHOICES, default='personal')
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-week_start_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'week_start_date', 'tab']),
        ]
        unique_together = ['user', 'title', 'week_start_date', 'tab']
    
    def __str__(self):
        return f"{self.title} (Week of {self.week_start_date})"
    
    @property
    def week_end_date(self):
        """Calculate the Sunday of this week."""
        return self.week_start_date + timedelta(days=6)


class MonthlyTask(models.Model):
    """
    Monthly task/milestone - represents a task for an entire month.
    """
    TAB_CHOICES = [
        ('personal', 'Personal'),
        ('work', 'Work'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monthly_tasks')
    title = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    month = models.IntegerField(help_text='Month number (1-12)')
    year = models.IntegerField(help_text='Year (e.g., 2025)')
    tab = models.CharField(max_length=20, choices=TAB_CHOICES, default='personal')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-month', '-created_at']
        indexes = [
            models.Index(fields=['user', 'year', 'month', 'tab']),
        ]
        unique_together = ['user', 'title', 'month', 'year', 'tab']
    
    def __str__(self):
        from calendar import month_name
        return f"{self.title} ({month_name[self.month]} {self.year})"


class YearlyTask(models.Model):
    """
    Yearly task/goal - represents annual objectives and goals.
    """
    QUARTER_CHOICES = [
        ('Q1', 'Q1 (Jan-Mar)'),
        ('Q2', 'Q2 (Apr-Jun)'),
        ('Q3', 'Q3 (Jul-Sep)'),
        ('Q4', 'Q4 (Oct-Dec)'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='yearly_tasks')
    title = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    year = models.IntegerField(help_text='Year (e.g., 2025)')
    quarter = models.CharField(max_length=2, choices=QUARTER_CHOICES, blank=True, help_text='Optional quarter assignment')
    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-created_at']
        indexes = [
            models.Index(fields=['user', 'year']),
        ]
        unique_together = ['user', 'title', 'year']
    
    def __str__(self):
        return f"{self.title} ({self.year})"
