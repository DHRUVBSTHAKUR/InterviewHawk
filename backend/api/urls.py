from django.urls import path
from . import views

urlpatterns = [
    path("generate-question/", views.generate_question, name="generate_question"),
    path("history/", views.get_interview_history, name="get_interview_history"), # <-- New!
]