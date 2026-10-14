from rest_framework import serializers
from .models import Department, Semester

class DepartmentSerializer(serializers.ModelSerializer):
    hod_name = serializers.ReadOnlyField(source="hod.name")
    hod_email = serializers.ReadOnlyField(source="hod.email")

    class Meta:
        model = Department
        fields = ["id", "name", "code", "hod", "hod_name", "hod_email", "created_at"]


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ["id", "academic_year", "identifier", "start_date", "end_date", "is_active", "created_at"]
