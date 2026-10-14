from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from .models import Assessment, AssessmentResult
from .serializers import AssessmentSerializer, AssessmentResultSerializer
from projects.models import Project
from accounts.models import User
from accounts.permissions import IsHOD, IsHODOrFaculty
from notifications.models import Notification, ActivityLog

class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    queryset = Assessment.objects.all()

    def get_queryset(self):
        qs = Assessment.objects.all()
        semester_id = self.request.query_params.get("semester")
        department_id = self.request.query_params.get("department")
        if semester_id:
            qs = qs.filter(semester_id=semester_id)
        if department_id:
            qs = qs.filter(department_id=department_id)
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve", "gradebook"]:
            return [permissions.IsAuthenticated()]
        return [IsHOD()]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def gradebook(self, request):
        user = request.user
        project_id = request.query_params.get("project")

        # Determine target project
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
        elif user.role == User.Role.STUDENT:
            project = Project.objects.filter(
                team__memberships__student=user,
                team__memberships__status="ACTIVE"
            ).first()

        if not project:
            return Response({
                "detail": "No associated project found for gradebook.",
                "assessments": [],
                "overall_score": None,
                "grade": None,
                "total_weightage": 0,
            })

        assessments = Assessment.objects.filter(
            semester=project.semester,
            department=project.department,
            is_active=True
        ).order_by("code")

        results = AssessmentResult.objects.filter(project=project)
        results_map = {r.assessment_id: r for r in results}

        evaluated_sum = Decimal("0.0")
        total_evaluated_weightage = Decimal("0.0")
        total_possible_weightage = Decimal("0.0")
        gradebook_items = []

        for asm in assessments:
            res = results_map.get(asm.id)
            item = {
                "assessment_id": asm.id,
                "title": asm.title,
                "code": asm.code,
                "type": asm.assessment_type,
                "max_marks": float(asm.max_marks),
                "weightage": float(asm.weightage),
                "due_date": asm.due_date,
                "venue": asm.venue,
                "status": "Evaluated" if res else "Pending",
                "marks_obtained": float(res.marks_obtained) if res else None,
                "feedback": res.feedback if res else "",
                "evaluator_name": res.evaluator.name if res and res.evaluator else None,
                "evaluated_at": res.evaluated_at if res else None,
            }
            total_possible_weightage += asm.weightage

            if res and res.marks_obtained is not None and asm.max_marks > 0:
                weighted_contribution = (Decimal(str(res.marks_obtained)) / Decimal(str(asm.max_marks))) * Decimal(str(asm.weightage))
                evaluated_sum += weighted_contribution
                total_evaluated_weightage += Decimal(str(asm.weightage))
                item["weighted_contribution"] = float(round(weighted_contribution, 2))
            else:
                item["weighted_contribution"] = None

            gradebook_items.append(item)

        # Dynamic normalized grade calculation
        overall_percentage = None
        final_grade = "Incomplete"

        if total_evaluated_weightage > 0:
            overall_percentage = float(round((evaluated_sum / total_evaluated_weightage) * 100, 2))
            if overall_percentage >= 90:
                final_grade = "O (Outstanding)"
            elif overall_percentage >= 80:
                final_grade = "A+ (Excellent)"
            elif overall_percentage >= 70:
                final_grade = "A (Very Good)"
            elif overall_percentage >= 60:
                final_grade = "B+ (Good)"
            elif overall_percentage >= 50:
                final_grade = "B (Above Average)"
            else:
                final_grade = "F (Fail)"

        return Response({
            "project_id": project.id,
            "project_title": project.title,
            "batch": project.batch,
            "assessments": gradebook_items,
            "total_evaluated_weightage": float(total_evaluated_weightage),
            "total_possible_weightage": float(total_possible_weightage),
            "cumulative_score": float(round(evaluated_sum, 2)),
            "overall_percentage": overall_percentage,
            "final_grade": final_grade,
        })


class AssessmentResultViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentResultSerializer
    queryset = AssessmentResult.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return AssessmentResult.objects.none()
        qs = AssessmentResult.objects.select_related("assessment", "project", "evaluator", "student")
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        result = serializer.save(evaluator=self.request.user)
        ActivityLog.objects.create(
            actor=self.request.user,
            action=f"Entered assessment score {result.marks_obtained}/{result.assessment.max_marks} for '{result.assessment.code}' on '{result.project.title}'",
            project=result.project,
            metadata={"marks": str(result.marks_obtained), "code": result.assessment.code}
        )

        # Notify team
        if hasattr(result.project, "team"):
            for m in result.project.team.memberships.filter(status="ACTIVE"):
                Notification.objects.create(
                    recipient=m.student,
                    title=f"Assessment Graded: {result.assessment.code}",
                    message=f"Marks published for {result.assessment.title}: {result.marks_obtained}/{result.assessment.max_marks} Marks.",
                    notification_type=Notification.Type.MARKS_PUBLISHED,
                    related_link="/student/gradebook"
                )
