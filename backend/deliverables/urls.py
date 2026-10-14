from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MilestoneViewSet, WeeklyDeliverableViewSet, TaskViewSet

router = DefaultRouter()
router.register(r"milestones", MilestoneViewSet, basename="milestone")
router.register(r"deliverables", WeeklyDeliverableViewSet, basename="deliverable")
router.register(r"tasks", TaskViewSet, basename="task")

urlpatterns = [
    path("", include(router.urls)),
]
