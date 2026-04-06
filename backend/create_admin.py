import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'interview_hawk.settings')
django.setup()

from django.contrib.auth.models import User

# Exact credentials from your request
users_to_create = [
    ('dhruv', 'dhruv@123'),
    ('taniya', 'sindhi@imposter'),
    ('naresh', 'naresh@123'),
    ('shreya', 'shreya@123'),
    ('ansh',ansh@123)
]

print("--- Starting User Sync ---")

for username, password in users_to_create:
    user, created = User.objects.get_or_create(username=username)
    user.set_password(password) # This ensures the password is saved correctly
    user.is_superuser = True
    user.is_staff = True
    user.save()
    
    if created:
        print(f"✅ Created NEW user: {username}")
    else:
        print(f"🔄 Updated EXISTING user: {username}")

print("--- User Sync Complete ---")