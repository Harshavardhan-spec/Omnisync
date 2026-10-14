import json
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Submission, SubmissionFile, Review
from .serializers import SubmissionSerializer, ReviewSerializer, SubmissionFileSerializer
from projects.models import Project
from deliverables.models import WeeklyDeliverable
from accounts.models import User
from accounts.permissions import IsFaculty, IsHODOrFaculty
from notifications.models import Notification, ActivityLog

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "pptx", "ppt", "zip", "tar", "gz", "txt"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Submission.objects.none()

        qs = Submission.objects.select_related(
            "project", "deliverable", "submitted_by", "team"
        ).prefetch_related("files", "reviews__reviewer")

        project_id = self.request.query_params.get("project")
        deliverable_id = self.request.query_params.get("deliverable")

        if project_id:
            qs = qs.filter(project_id=project_id)
        if deliverable_id:
            qs = qs.filter(deliverable_id=deliverable_id)

        if user.role == User.Role.HOD:
            return qs.all()
        elif user.role == User.Role.FACULTY:
            return qs.filter(
                project__mentor_assignments__faculty=user,
                project__mentor_assignments__status="ACTIVE"
            ).distinct()
        else: # STUDENT
            return qs.filter(
                project__team__memberships__student=user,
                project__team__memberships__status="ACTIVE"
            ).distinct()

    def create(self, request, *args, **kwargs):
        project_id = request.data.get("project")
        deliverable_id = request.data.get("deliverable")

        if not project_id or not deliverable_id:
            return Response(
                {"detail": "Both project and deliverable IDs are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = get_object_or_404(Project, id=project_id)
        deliverable = get_object_or_404(WeeklyDeliverable, id=deliverable_id)

        # Security check: User must belong to this project
        if request.user.role == User.Role.STUDENT:
            if not project.team or not project.team.memberships.filter(student=request.user, status="ACTIVE").exists():
                return Response(
                    {"detail": "You do not have permission to submit for this project."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Revision handling: Find existing submissions
        previous_subs = Submission.objects.filter(project=project, deliverable=deliverable)
        revision_number = 1
        if previous_subs.exists():
            latest = previous_subs.order_by("-revision_number").first()
            revision_number = latest.revision_number + 1
            previous_subs.update(is_current_revision=False)

        notes = request.data.get("notes", "")
        repo_url = request.data.get("repo_url", "")
        demo_url = request.data.get("demo_url", "")
        additional_links_raw = request.data.get("additional_links", "[]")

        additional_links = []
        if isinstance(additional_links_raw, str):
            try:
                additional_links = json.loads(additional_links_raw)
            except Exception:
                additional_links = [additional_links_raw] if additional_links_raw else []
        elif isinstance(additional_links_raw, list):
            additional_links = additional_links_raw

        # Server-authoritative deadline evaluation
        is_late = False
        today = timezone.now().date()
        if deliverable.due_date and today > deliverable.due_date:
            is_late = True

        submission = Submission.objects.create(
            project=project,
            deliverable=deliverable,
            team=project.team if hasattr(project, "team") else None,
            submitted_by=request.user,
            notes=notes,
            repo_url=repo_url,
            demo_url=demo_url,
            additional_links=additional_links,
            revision_number=revision_number,
            status=Submission.Status.LATE if is_late else Submission.Status.SUBMITTED,
            is_late=is_late,
            is_current_revision=True,
        )

        # Process uploaded files with strict validation
        uploaded_files = request.FILES.getlist("files")
        for f in uploaded_files:
            if f.size > MAX_FILE_SIZE:
                return Response(
                    {"detail": f"File '{f.name}' exceeds the 25MB limit."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ext = f.name.split(".")[-1].lower() if "." in f.name else ""
            if ext not in ALLOWED_EXTENSIONS:
                return Response(
                    {"detail": f"File extension '.{ext}' is not supported. Use PDF, DOCX, PPTX, or ZIP."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            SubmissionFile.objects.create(
                submission=submission,
                file=f,
                original_filename=f.name,
                file_type=f.content_type or ext,
                file_size=f.size
            )

        # Log activity
        ActivityLog.objects.create(
            actor=request.user,
            action=f"Submitted deliverable for Week {deliverable.week_number} (Rev {revision_number})",
            project=project
        )

        # Notify assigned faculty mentor
        primary_mentor = project.primary_mentor
        if primary_mentor:
            Notification.objects.create(
                recipient=primary_mentor,
                title=f"New Deliverable Submitted: Week {deliverable.week_number}",
                message=f"Team '{project.team.name if hasattr(project, 'team') else ''}' submitted Week {deliverable.week_number} ({deliverable.title}).",
                notification_type=Notification.Type.SUBMISSION_RECEIVED,
                related_link=f"/faculty/submissions"
            )

        return Response(
            SubmissionSerializer(submission, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"], permission_classes=[IsHODOrFaculty])
    def review(self, request, pk=None):
        submission = self.get_object()
        project = submission.project

        # Authorization: Faculty must be assigned mentor or HOD
        if request.user.role == User.Role.FACULTY:
            is_assigned = project.mentor_assignments.filter(
                faculty=request.user, status="ACTIVE"
            ).exists()
            if not is_assigned:
                return Response(
                    {"detail": "You are not authorized to review this submission."},
                    status=status.HTTP_403_FORBIDDEN
                )

        outcome = request.data.get("outcome", Review.Outcome.APPROVED)
        feedback = request.data.get("feedback", "")
        marks_awarded = request.data.get("marks_awarded")
        max_marks = request.data.get("max_marks", 30.00)

        if not feedback:
            return Response(
                {"detail": "Review feedback is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create Review record preserving history
        review = Review.objects.create(
            submission=submission,
            reviewer=request.user,
            outcome=outcome,
            feedback=feedback,
            marks_awarded=marks_awarded if marks_awarded not in (None, "") else None,
            max_marks=max_marks
        )

        # Update submission status
        if outcome == Review.Outcome.APPROVED:
            submission.status = Submission.Status.APPROVED
        elif outcome == Review.Outcome.CHANGES_REQUESTED:
            submission.status = Submission.Status.CHANGES_REQUESTED
        elif outcome == Review.Outcome.REJECTED:
            submission.status = Submission.Status.REJECTED
        else:
            submission.status = Submission.Status.UNDER_REVIEW
        submission.save()

        # Log Activity
        ActivityLog.objects.create(
            actor=request.user,
            action=f"Reviewed Week {submission.deliverable.week_number} submission: {outcome}",
            project=project,
            metadata={"outcome": outcome, "marks": str(marks_awarded)}
        )

        # Notify team members
        if hasattr(project, "team"):
            notif_type = Notification.Type.CHANGES_REQUESTED if outcome == Review.Outcome.CHANGES_REQUESTED else Notification.Type.REVIEW_COMPLETED
            for m in project.team.memberships.filter(status="ACTIVE"):
                Notification.objects.create(
                    recipient=m.student,
                    title=f"Faculty Review: {outcome}",
                    message=f"Review completed for Week {submission.deliverable.week_number}: {feedback[:100]}...",
                    notification_type=notif_type,
                    related_link="/student/weekly-deliverables"
                )

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
