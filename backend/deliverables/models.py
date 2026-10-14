from django.db import models
from django.conf import settings
from django.utils import timezone

class Milestone(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        DELAYED = "DELAYED", "Delayed"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="milestones",
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.CASCADE,
        related_name="milestones",
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    weightage_marks = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["order", "due_date"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class WeeklyDeliverable(models.Model):
    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="weekly_deliverables"
    )
    semester = models.ForeignKey(
        "departments.Semester",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="weekly_deliverables"
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_weekly_deliverables"
    )
    week_number = models.PositiveIntegerField(help_text="Week number 1 to 16")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    required_deliverables = models.JSONField(
        default=list,
        help_text="List of required items for this week"
    )
    due_date = models.DateField(null=True, blank=True)
    maximum_marks = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["week_number"]

    def __str__(self):
        return f"Week {self.week_number}: {self.title}"


class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class Status(models.TextChoices):
        TODO = "TODO", "To Do"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        OVERDUE = "OVERDUE", "Overdue"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )
    weekly_deliverable = models.ForeignKey(
        WeeklyDeliverable,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks"
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["due_date", "-priority"]

    def __str__(self):
        return f"{self.title} - {self.status}"

    @property
    def is_past_due(self):
        if self.due_date and self.status != self.Status.COMPLETED:
            return self.due_date < timezone.now().date()
        return False
