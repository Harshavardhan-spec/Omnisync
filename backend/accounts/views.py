from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, LoginSerializer, UserProvisionSerializer
from .permissions import IsHOD

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        redirect_map = {
            User.Role.HOD: "/hod",
            User.Role.FACULTY: "/faculty",
            User.Role.STUDENT: "/student",
        }

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
            "redirect_path": redirect_map.get(user.role, "/login"),
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get("role")
        department = self.request.query_params.get("department")
        search = self.request.query_params.get("search")

        if role:
            qs = qs.filter(role=role)
        if department:
            qs = qs.filter(department_id=department)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(email__icontains=search) | qs.filter(roll_number__icontains=search)
        return qs


class UserProvisionView(generics.CreateAPIView):
    permission_classes = [IsHOD]
    serializer_class = UserProvisionSerializer
