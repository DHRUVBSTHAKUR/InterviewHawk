import os
import django

# Set the settings module (matches your folder name)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'interview_hawk.settings')
django.setup()

from django.contrib.auth.models import User

# The 4 users for your team
users_to_create = [
    ('dhruv', 'dhruv@123'),
    ('taniya', 'Mrnoob@sleep'),
    ('naresh', 'naresh@123'),
    ('shreya', 'shreya@123')
]

for username, password in users_to_create:
    if not User.objects.filter(username=username).exists():
        # Using create_superuser for everyone so they all have full access
        User.objects.create_superuser(username=username, password=password, email=f"{username}@example.com")
        print(f"✅ User {username} created successfully!")
    else:
        print(f"ℹ️ User {username} already exists.")