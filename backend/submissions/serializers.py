from rest_framework import serializers
from .models import Submission, SubmissionFile, Review
from accounts.serializers import UserSerializer
from deliverables.serializers import WeeklyDeliverableSerializer

class SubmissionFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionFile
        fields = [
            "id",
            "file",
            "file_url",
            "original_filename",
            "file_type",
            "file_size",
            "uploaded_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_details = UserSerializer(source="reviewer", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "submission",
            "reviewer",
            "reviewer_details",
            "outcome",
            "feedback",
            "marks_awarded",
            "max_marks",
            "reviewed_at",
        ]
        read_only_fields = ["id", "reviewer", "reviewed_at"]

    def validate_marks_awarded(self, value):
        if value is not None:
            max_marks = self.initial_data.get("max_marks", 30)
            try:
                max_marks = float(max_marks)
                if float(value) < 0 or float(value) > max_marks:
                    raise serializers.ValidationError(f"Marks must be between 0 and {max_marks}.")
            except (ValueError, TypeError):
                pass
        return value


class SubmissionBriefSerializer(serializers.ModelSerializer):
    latest_review = serializers.SerializerMethodField()
    files_count = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "project",
            "deliverable",
            "revision_number",
            "status",
            "is_late",
            "submitted_at",
            "latest_review",
            "files_count",
        ]

    def get_latest_review(self, obj):
        rev = obj.reviews.first()
        if rev:
            return ReviewSerializer(rev).data
        return None

    def get_files_count(self, obj):
        return obj.files.count()


class SubmissionSerializer(serializers.ModelSerializer):
    files = SubmissionFileSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    submitted_by_details = UserSerializer(source="submitted_by", read_only=True)
    deliverable_details = WeeklyDeliverableSerializer(source="deliverable", read_only=True)
    latest_review = serializers.SerializerMethodField()
    revisions_history = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "project",
            "deliverable",
            "deliverable_details",
            "team",
            "submitted_by",
            "submitted_by_details",
            "submitted_at",
            "notes",
            "repo_url",
            "demo_url",
            "additional_links",
            "revision_number",
            "status",
            "is_late",
            "is_current_revision",
            "files",
            "reviews",
            "latest_review",
            "revisions_history",
        ]
        read_only_fields = [
            "id",
            "submitted_by",
            "submitted_at",
            "revision_number",
            "is_late",
            "is_current_revision",
        ]

    def get_latest_review(self, obj):
        rev = obj.reviews.first()
        if rev:
            return ReviewSerializer(rev).data
        return None

    def get_revisions_history(self, obj):
        # Fetch all previous revisions for the same project and deliverable
        other_revs = Submission.objects.filter(
            project=obj.project,
            deliverable=obj.deliverable
        ).exclude(id=obj.id).order_by("-revision_number")
        return SubmissionBriefSerializer(other_revs, many=True).data
