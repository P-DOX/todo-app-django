#!/usr/bin/env python
"""Apply default tasks for a user"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todo_project.settings')
django.setup()

from tasks.models import Task, DefaultTask, User

# Get the user
username = 'pdox1234'
user = User.objects.get(username=username)

print(f'\n=== User: {user.username} ===')
print(f'Default task templates: {DefaultTask.objects.filter(user=user).count()}')
print(f'Current actual tasks: {Task.objects.filter(user=user).count()}\n')

# Show default tasks
print('Default tasks configured:')
for dt in DefaultTask.objects.filter(user=user):
    days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    print(f'  {days[dt.weekday]}: {dt.title} (tab: {dt.tab})')

print('\n--- Applying defaults for date range ---')

# Apply defaults for the next 7 days
start_date = date.today()
for i in range(7):
    current_date = start_date + timedelta(days=i)
    created_personal = DefaultTask.apply_defaults_for_date(user, current_date, 'personal')
    created_work = DefaultTask.apply_defaults_for_date(user, current_date, 'work')
    total = created_personal + created_work
    if total > 0:
        print(f'  {current_date}: Created {total} tasks ({created_personal} personal, {created_work} work)')

print(f'\n=== Total tasks now: {Task.objects.filter(user=user).count()} ===\n')

# Show some tasks
print('Sample tasks created:')
for task in Task.objects.filter(user=user).order_by('date')[:10]:
    status = '✓' if task.completed else '○'
    print(f'  {status} {task.date} - {task.title} ({task.tab})')
