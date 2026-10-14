from rest_framework import viewsets, permissions
from .models import Milestone, WeeklyDeliverable, Task
from .serializers import MilestoneSerializer, WeeklyDeliverableSerializer, TaskSerializer
from accounts.permissions import IsHOD, IsHODOrFaculty

class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    queryset = Milestone.objects.all()

    def get_queryset(self):
        qs = Milestone.objects.all()
        project_id = self.request.query_params.get("project")
        department_id = self.request.query_params.get("department")
        if project_id:
            qs = qs.filter(project_id=project_id)
        if department_id:
            qs = qs.filter(department_id=department_id)
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [IsHODOrFaculty()]


class WeeklyDeliverableViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyDeliverableSerializer
    queryset = WeeklyDeliverable.objects.all()

    def get_queryset(self):
        qs = WeeklyDeliverable.objects.all().order_by("week_number")
        semester_id = self.request.query_params.get("semester")
        department_id = self.request.query_params.get("department")
        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if department_id:
            qs = qs.filter(department_id=department_id)
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [IsHOD()]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        qs = Task.objects.select_related("assigned_to", "project")
        project_id = self.request.query_params.get("project")
        status_filter = self.request.query_params.get("status")

        if project_id:
            qs = qs.filter(project_id=project_id)
        elif user.role == "STUDENT":
            qs = qs.filter(project__team__memberships__student=user, project__team__memberships__status="ACTIVE")
        elif user.role == "FACULTY":
            qs = qs.filter(project__mentor_assignments__faculty=user, project__mentor_assignments__status="ACTIVE")

        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs
