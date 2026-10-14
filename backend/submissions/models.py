from django.db import models
from django.conf import settings
from django.utils import timezone

class Submission(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
        CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes Requested"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        LATE = "LATE", "Late"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="submissions"
    )
    deliverable = models.ForeignKey(
        "deliverables.WeeklyDeliverable",
        on_delete=models.CASCADE,
        related_name="submissions"
    )
    team = models.ForeignKey(
        "projects.Team",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submissions"
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    repo_url = models.URLField(max_length=500, blank=True, null=True)
    demo_url = models.URLField(max_length=500, blank=True, null=True)
    additional_links = models.JSONField(default=list, blank=True)
    revision_number = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.SUBMITTED
    )
    is_late = models.BooleanField(default=False)
    is_current_revision = models.BooleanField(default=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.project.title} - Week {self.deliverable.week_number} (Rev {self.revision_number})"

    def check_and_set_late(self):
        if self.deliverable.due_date:
            sub_date = self.submitted_at.date() if self.submitted_at else timezone.now().date()
            if sub_date > self.deliverable.due_date:
                self.is_late = True
                if self.status == self.Status.SUBMITTED:
                    self.status = self.Status.LATE


class SubmissionFile(models.Model):
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name="files"
    )
    file = models.FileField(upload_to="submissions/%Y/%m/")
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField(help_text="Size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.original_filename} ({self.file_size} bytes)"


class Review(models.Model):
    class Outcome(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes Requested"
        REJECTED = "REJECTED", "Rejected"

    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conducted_reviews"
    )
    outcome = models.CharField(
        max_length=30,
        choices=Outcome.choices,
        default=Outcome.APPROVED
    )
    feedback = models.TextField()
    marks_awarded = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-reviewed_at"]

    def __str__(self):
        return f"Review by {self.reviewer.name}: {self.outcome}"
