from django.urls import path
from . import views

urlpatterns = [
    # This automatically becomes /api/generate-question/
    path("generate-question/", views.generate_question),
    
    # This automatically becomes /api/grade-answer/
    path("grade-answer/", views.grade_answer),
]