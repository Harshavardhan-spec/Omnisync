from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Notification, Message, ActivityLog
from .serializers import NotificationSerializer, MessageSerializer, ActivityLogSerializer
from accounts.models import User
from accounts.permissions import IsHOD

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(recipient=user).order_by("-created_at")

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"status": "read"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all marked as read"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count})


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Message.objects.none()
        return Message.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).select_related("sender", "recipient", "project").order_by("-created_at")

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        # Notify recipient
        Notification.objects.create(
            recipient=msg.recipient,
            title=f"New Message from {self.request.user.name}",
            message=f"{msg.subject}: {msg.content[:80]}...",
            notification_type=Notification.Type.ANNOUNCEMENT,
            related_link="/inbox"
        )


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ActivityLog.objects.none()
        qs = ActivityLog.objects.select_related("actor", "project").order_by("-timestamp")
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        elif user.role != User.Role.HOD:
            if user.role == User.Role.FACULTY:
                qs = qs.filter(project__mentor_assignments__faculty=user)
            else: # STUDENT
                qs = qs.filter(project__team__memberships__student=user)
        return qs
