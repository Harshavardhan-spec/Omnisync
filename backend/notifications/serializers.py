from rest_framework import serializers
from .models import Notification, Message, ActivityLog
from accounts.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "title",
            "message",
            "notification_type",
            "related_link",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "recipient", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender_details = UserSerializer(source="sender", read_only=True)
    recipient_details = UserSerializer(source="recipient", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_details",
            "recipient",
            "recipient_details",
            "project",
            "subject",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "created_at"]


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source="actor.name")
    actor_role = serializers.ReadOnlyField(source="actor.role")
    project_title = serializers.ReadOnlyField(source="project.title")

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "actor",
            "actor_name",
            "actor_role",
            "action",
            "project",
            "project_title",
            "metadata",
            "timestamp",
        ]
