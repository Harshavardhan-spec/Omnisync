from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TeamViewSet, MentorAssignmentViewSet

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"teams", TeamViewSet, basename="team")
router.register(r"mentor-assignments", MentorAssignmentViewSet, basename="mentor-assignment")

urlpatterns = [
    path("", include(router.urls)),
]
