from django.db import models
from django.contrib.auth.models import User

class InterviewSession(models.Model):
    # Link each session to a specific user
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="interviews")
    
    # Store the core data
    resume_name = models.CharField(max_length=255)
    ai_question = models.TextField()
    user_answer = models.TextField(blank=True, null=True)
    
    # Store the AI's grading
    technical_score = models.IntegerField(default=0)
    feedback = models.TextField(blank=True, null=True)
    
    # Automatically track when the interview happened
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.resume_name}"