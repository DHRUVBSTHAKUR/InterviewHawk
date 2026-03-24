from django.urls import path
from .views import generate_question, grade_answer, get_interview_history

# NEW: Import the JWT Token views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # --- AUTHENTICATION ROUTES ---
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- INTERVIEW HAWK ROUTES ---
    path('generate-question/', generate_question, name='generate-question'),
    path('grade-answer/', grade_answer, name='grade-answer'),
    path('history/', get_interview_history, name='history'),
]