from rest_framework import serializers
from .models import Assessment, AssessmentResult
from accounts.serializers import UserSerializer
from projects.models import Project

class AssessmentSerializer(serializers.ModelSerializer):
    evaluated_count = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            "id",
            "title",
            "code",
            "assessment_type",
            "semester",
            "department",
            "max_marks",
            "weightage",
            "due_date",
            "venue",
            "description",
            "is_active",
            "is_published",
            "evaluated_count",
            "created_at",
        ]

    def get_evaluated_count(self, obj):
        return obj.results.count()


class AssessmentResultSerializer(serializers.ModelSerializer):
    evaluator_details = UserSerializer(source="evaluator", read_only=True)
    assessment_details = AssessmentSerializer(source="assessment", read_only=True)
    student_name = serializers.ReadOnlyField(source="student.name")
    project_title = serializers.ReadOnlyField(source="project.title")

    class Meta:
        model = AssessmentResult
        fields = [
            "id",
            "assessment",
            "assessment_details",
            "project",
            "project_title",
            "student",
            "student_name",
            "evaluator",
            "evaluator_details",
            "marks_obtained",
            "feedback",
            "evaluated_at",
            "is_moderated",
        ]
        read_only_fields = ["id", "evaluator", "evaluated_at"]

    def validate_marks_obtained(self, value):
        assessment_id = self.initial_data.get("assessment")
        if assessment_id:
            try:
                assessment = Assessment.objects.get(id=assessment_id)
                if value < 0 or value > assessment.max_marks:
                    raise serializers.ValidationError(
                        f"Marks obtained must be between 0 and {assessment.max_marks}."
                    )
            except Assessment.DoesNotExist:
                pass
        return value
