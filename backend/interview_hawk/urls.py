from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    
    # --- AUTHENTICATION ENDPOINTS ---
    # This is where the user "Logs In" to get their tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # This is used to get a new access token when the old one expires
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]