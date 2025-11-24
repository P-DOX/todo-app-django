from django.core.management.base import BaseCommand
from tasks.models import DefaultTask
from django.contrib.auth import get_user_model
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Apply default tasks for a user over a date range'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to apply defaults for')
        parser.add_argument('--days', type=int, default=30, help='Number of days ahead to create tasks')

    def handle(self, *args, **options):
        username = options['username']
        days = options['days']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User "{username}" not found'))
            return
        
        self.stdout.write(f'Applying defaults for user: {user.username}')
        self.stdout.write(f'Date range: {days} days from today')
        
        start_date = date.today()
        total_created = 0
        
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            created_personal = DefaultTask.apply_defaults_for_date(user, current_date, 'personal')
            created_work = DefaultTask.apply_defaults_for_date(user, current_date, 'work')
            day_total = created_personal + created_work
            total_created += day_total
            
            if day_total > 0:
                self.stdout.write(f'  {current_date}: {day_total} tasks')
        
        self.stdout.write(self.style.SUCCESS(f'\nTotal tasks created: {total_created}'))
