from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Project, Team, TeamMembership, MentorAssignment
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    TeamSerializer,
    TeamMemberSerializer,
    MentorAssignmentSerializer,
)
from accounts.models import User
from accounts.permissions import IsHOD, IsFaculty, IsStudent
from notifications.models import Notification, ActivityLog

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Project.objects.none()

        qs = Project.objects.select_related("semester", "department", "team", "created_by").prefetch_related(
            "team__memberships__student",
            "mentor_assignments__faculty"
        )

        if user.role == User.Role.HOD:
            if user.department:
                return qs.filter(department=user.department)
            return qs.all()
        elif user.role == User.Role.FACULTY:
            return qs.filter(mentor_assignments__faculty=user, mentor_assignments__status="ACTIVE").distinct()
        else: # STUDENT
            return qs.filter(
                models.Q(created_by=user) | models.Q(team__memberships__student=user, team__memberships__status="ACTIVE")
            ).distinct()

    def get_serializer_class(self):
        if self.action == "create":
            return ProjectCreateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        project = serializer.save()
        ActivityLog.objects.create(
            actor=self.request.user,
            action=f"Registered new project proposal: '{project.title}'",
            project=project
        )
        # Notify HOD
        hod_users = User.objects.filter(role=User.Role.HOD)
        if project.department:
            dept_hods = hod_users.filter(department=project.department)
            if dept_hods.exists():
                hod_users = dept_hods
        for hod in hod_users:
            Notification.objects.create(
                recipient=hod,
                title="New Project Proposal Submitted",
                message=f"Team '{project.team.name if hasattr(project, 'team') else ''}' submitted proposal '{project.title}' for review.",
                notification_type=Notification.Type.PROJECT_APPROVAL,
                related_link=f"/hod/projects"
            )

    @action(detail=True, methods=["post"], permission_classes=[IsHOD])
    def approve(self, request, pk=None):
        project = self.get_object()
        project.status = Project.Status.APPROVED
        project.save()

        ActivityLog.objects.create(
            actor=request.user,
            action=f"Approved project: '{project.title}'",
            project=project
        )

        # Notify team members
        if hasattr(project, "team"):
            for membership in project.team.memberships.filter(status="ACTIVE"):
                Notification.objects.create(
                    recipient=membership.student,
                    title="Project Proposal Approved",
                    message=f"Your project proposal '{project.title}' has been approved by HOD.",
                    notification_type=Notification.Type.PROJECT_APPROVAL,
                    related_link="/student/mini-project"
                )

        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=["post"], permission_classes=[IsHOD])
    def reject(self, request, pk=None):
        project = self.get_object()
        reason = request.data.get("reason", "Proposal does not meet department requirements.")
        project.status = Project.Status.REJECTED
        project.rejection_reason = reason
        project.save()

        ActivityLog.objects.create(
            actor=request.user,
            action=f"Rejected project: '{project.title}' (Reason: {reason})",
            project=project,
            metadata={"reason": reason}
        )

        if hasattr(project, "team"):
            for membership in project.team.memberships.filter(status="ACTIVE"):
                Notification.objects.create(
                    recipient=membership.student,
                    title="Project Proposal Rejected",
                    message=f"Your project '{project.title}' was rejected: {reason}",
                    notification_type=Notification.Type.PROJECT_APPROVAL,
                    related_link="/student/mini-project"
                )

        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=["post"], permission_classes=[IsHOD])
    def assign_mentor(self, request, pk=None):
        project = self.get_object()
        if project.status not in [Project.Status.APPROVED, Project.Status.IN_PROGRESS]:
            return Response(
                {"detail": "Approve the project proposal before assigning a faculty guide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        faculty_id = request.data.get("faculty_id")
        faculty = get_object_or_404(User, id=faculty_id, role=User.Role.FACULTY)

        # Deactivate previous primary mentor assignments
        project.mentor_assignments.filter(is_primary=True).update(status="INACTIVE")

        assignment, created = MentorAssignment.objects.update_or_create(
            project=project,
            faculty=faculty,
            defaults={
                "assigned_by": request.user,
                "is_primary": True,
                "status": "ACTIVE"
            }
        )

        ActivityLog.objects.create(
            actor=request.user,
            action=f"Assigned faculty guide {faculty.name} to '{project.title}'",
            project=project
        )

        # Notify faculty
        Notification.objects.create(
            recipient=faculty,
            title="Assigned as Project Guide",
            message=f"You have been assigned as the faculty guide for project '{project.title}'.",
            notification_type=Notification.Type.MENTOR_ASSIGNMENT,
            related_link=f"/faculty/projects"
        )

        # Notify students
        if hasattr(project, "team"):
            for membership in project.team.memberships.filter(status="ACTIVE"):
                Notification.objects.create(
                    recipient=membership.student,
                    title="Faculty Guide Assigned",
                    message=f"{faculty.name} has been assigned as your project guide.",
                    notification_type=Notification.Type.MENTOR_ASSIGNMENT,
                    related_link="/student/team"
                )

        return Response(ProjectSerializer(project).data)


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    queryset = Team.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Team.objects.none()
        if user.role == User.Role.HOD:
            return Team.objects.all()
        elif user.role == User.Role.FACULTY:
            return Team.objects.filter(project__mentor_assignments__faculty=user, project__mentor_assignments__status="ACTIVE")
        return Team.objects.filter(memberships__student=user, memberships__status="ACTIVE").distinct()

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        team = self.get_object()
        # Security: Only team leader or HOD can add members
        if request.user != team.leader and request.user.role != User.Role.HOD:
            return Response({"detail": "Only team leader or HOD can add members."}, status=status.HTTP_403_FORBIDDEN)

        # Check max team size
        active_count = team.memberships.filter(status="ACTIVE").count()
        if active_count >= team.max_members:
            return Response({"detail": f"Team capacity reached (Max {team.max_members} members)."}, status=status.HTTP_400_BAD_REQUEST)

        student_id = request.data.get("student_id")
        student = get_object_or_404(User, id=student_id, role=User.Role.STUDENT)

        # Prevent duplicate membership in any active team
        existing_membership = TeamMembership.objects.filter(
            student=student,
            status="ACTIVE",
            team__project__semester=team.project.semester if team.project else None
        ).exclude(team=team)
        if existing_membership.exists():
            return Response({"detail": f"{student.name} is already registered in another project team for this semester."}, status=status.HTTP_400_BAD_REQUEST)

        responsibility = request.data.get("responsibility", "Module Development")
        membership, created = TeamMembership.objects.get_or_create(
            team=team,
            student=student,
            defaults={"role": TeamMembership.Role.MEMBER, "responsibility": responsibility, "status": "ACTIVE"}
        )
        if not created and membership.status != "ACTIVE":
            membership.status = "ACTIVE"
            membership.responsibility = responsibility
            membership.save()

        Notification.objects.create(
            recipient=student,
            title="Added to Project Team",
            message=f"You have been added to '{team.name}' for capstone project '{team.project.title if team.project else ''}'.",
            notification_type=Notification.Type.TASK_ASSIGNED,
            related_link="/student/team"
        )

        return Response(TeamSerializer(team).data)

    @action(detail=True, methods=["delete"])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        if request.user != team.leader and request.user.role != User.Role.HOD:
            return Response({"detail": "Only team leader or HOD can remove members."}, status=status.HTTP_403_FORBIDDEN)

        student_id = request.data.get("student_id")
        membership = get_object_or_404(TeamMembership, team=team, student_id=student_id)
        if membership.role == TeamMembership.Role.LEADER:
            return Response({"detail": "Cannot remove the team leader."}, status=status.HTTP_400_BAD_REQUEST)

        membership.status = "REMOVED"
        membership.save()
        return Response(TeamSerializer(team).data)


class MentorAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = MentorAssignmentSerializer
    queryset = MentorAssignment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
