from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet, AssessmentResultViewSet

router = DefaultRouter()
router.register(r"assessments", AssessmentViewSet, basename="assessment")
router.register(r"assessment-results", AssessmentResultViewSet, basename="assessment-result")

urlpatterns = [
    path("", include(router.urls)),
]
