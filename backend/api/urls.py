from django.urls import path
from .views import generate_question, grade_answer, get_interview_history

urlpatterns = [
    path('generate-question/', generate_question, name='generate-question'),
    path('grade-answer/', grade_answer, name='grade-answer'),
    path('history/', get_interview_history, name='history'),
]