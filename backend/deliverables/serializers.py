from rest_framework import serializers
from .models import Milestone, WeeklyDeliverable, Task
from accounts.serializers import UserSerializer

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = [
            "id",
            "project",
            "department",
            "title",
            "description",
            "due_date",
            "status",
            "weightage_marks",
            "order",
        ]


class WeeklyDeliverableSerializer(serializers.ModelSerializer):
    submission_count = serializers.SerializerMethodField()
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyDeliverable
        fields = [
            "id",
            "department",
            "semester",
            "project",
            "week_number",
            "title",
            "description",
            "required_deliverables",
            "due_date",
            "maximum_marks",
            "is_active",
            "submission_count",
            "my_submission",
            "created_at",
        ]

    def get_submission_count(self, obj):
        return obj.submissions.filter(is_current_revision=True).count()

    def get_my_submission(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        user = request.user
        # Find submission for user's project
        sub = obj.submissions.filter(
            project__team__memberships__student=user,
            project__team__memberships__status="ACTIVE",
            is_current_revision=True
        ).first()
        if sub:
            from submissions.serializers import SubmissionBriefSerializer
            return SubmissionBriefSerializer(sub).data
        return None


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source="assigned_to", read_only=True)
    is_overdue = serializers.ReadOnlyField(source="is_past_due")

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "milestone",
            "weekly_deliverable",
            "title",
            "description",
            "assigned_to",
            "assigned_to_details",
            "priority",
            "status",
            "due_date",
            "is_overdue",
            "created_at",
            "completed_at",
        ]
