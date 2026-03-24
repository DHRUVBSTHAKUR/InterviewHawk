from django.contrib import admin
from .models import InterviewSession

@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'resume_name', 'technical_score', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('resume_name', 'ai_question')