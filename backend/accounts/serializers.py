from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from departments.models import Department

class DepartmentBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code"]


class UserSerializer(serializers.ModelSerializer):
    department_details = DepartmentBriefSerializer(source="department", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "department",
            "department_details",
            "roll_number",
            "section",
            "college",
            "phone",
            "avatar",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "role", "created_at"]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled. Contact department administrator.")
        attrs["user"] = user
        return attrs


class UserProvisionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, default="Password@123")

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "department",
            "roll_number",
            "section",
            "phone",
            "password",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", "Password@123")
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
