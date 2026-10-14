from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, MessageViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"activity-logs", ActivityLogViewSet, basename="activity-log")

urlpatterns = [
    path("", include(router.urls)),
]
