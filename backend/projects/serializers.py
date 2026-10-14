from rest_framework import serializers
from .models import Project, Team, TeamMembership, MentorAssignment
from accounts.serializers import UserSerializer
from departments.serializers import DepartmentSerializer, SemesterSerializer
from departments.models import Semester

class TeamMemberSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source="student", read_only=True)

    class Meta:
        model = TeamMembership
        fields = [
            "id",
            "team",
            "student",
            "student_details",
            "role",
            "responsibility",
            "status",
            "joined_at",
        ]


class TeamSerializer(serializers.ModelSerializer):
    memberships = TeamMemberSerializer(many=True, read_only=True)
    leader_details = UserSerializer(source="leader", read_only=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "project",
            "leader",
            "leader_details",
            "max_members",
            "memberships",
            "created_at",
        ]


class MentorAssignmentSerializer(serializers.ModelSerializer):
    faculty_details = UserSerializer(source="faculty", read_only=True)
    assigned_by_name = serializers.ReadOnlyField(source="assigned_by.name")

    class Meta:
        model = MentorAssignment
        fields = [
            "id",
            "project",
            "faculty",
            "faculty_details",
            "assigned_by",
            "assigned_by_name",
            "is_primary",
            "status",
            "assigned_at",
        ]


class ProjectSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    department_details = DepartmentSerializer(source="department", read_only=True)
    semester_details = SemesterSerializer(source="semester", read_only=True)
    primary_mentor = UserSerializer(read_only=True)
    mentor_assignments = MentorAssignmentSerializer(many=True, read_only=True)
    health = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "objective",
            "description",
            "domain",
            "semester",
            "semester_details",
            "department",
            "department_details",
            "batch",
            "coordinator",
            "status",
            "rejection_reason",
            "created_by",
            "team",
            "primary_mentor",
            "mentor_assignments",
            "health",
            "registration_date",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "registration_date", "updated_at"]

    def get_health(self, obj):
        from .health import calculate_project_health
        return calculate_project_health(obj)


class ProjectCreateSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(write_only=True, required=False, default="Project Team")

    class Meta:
        model = Project
        fields = [
            "title",
            "objective",
            "description",
            "domain",
            "semester",
            "department",
            "batch",
            "coordinator",
            "team_name",
        ]
        extra_kwargs = {
            "semester": {"required": False},
            "department": {"required": False},
        }

    def validate(self, attrs):
        user = self.context["request"].user
        attrs.setdefault("department", user.department)
        attrs.setdefault("semester", Semester.objects.filter(is_active=True).first())

        if not attrs["department"]:
            raise serializers.ValidationError({"department": "Your account is not linked to a department."})
        if not attrs["semester"]:
            raise serializers.ValidationError({"semester": "No active semester is configured. Contact the HOD."})
        return attrs

    def create(self, validated_data):
        team_name = validated_data.pop("team_name", "Project Team")
        user = self.context["request"].user
        project = Project.objects.create(
            created_by=user,
            status=Project.Status.PENDING_APPROVAL,
            **validated_data
        )
        team = Team.objects.create(
            name=team_name,
            project=project,
            leader=user,
        )
        TeamMembership.objects.create(
            team=team,
            student=user,
            role=TeamMembership.Role.LEADER,
            responsibility="Team Leader & System Architect",
            status=TeamMembership.Status.ACTIVE
        )
        return project
