from django.db import models
from django.conf import settings

class Notification(models.Model):
    class Type(models.TextChoices):
        PROJECT_APPROVAL = "PROJECT_APPROVAL", "Project Approval"
        MENTOR_ASSIGNMENT = "MENTOR_ASSIGNMENT", "Mentor Assignment"
        TASK_ASSIGNED = "TASK_ASSIGNED", "Task Assigned"
        DEADLINE_UPCOMING = "DEADLINE_UPCOMING", "Upcoming Deadline"
        TASK_OVERDUE = "TASK_OVERDUE", "Task Overdue"
        SUBMISSION_RECEIVED = "SUBMISSION_RECEIVED", "Submission Received"
        REVIEW_COMPLETED = "REVIEW_COMPLETED", "Review Completed"
        CHANGES_REQUESTED = "CHANGES_REQUESTED", "Changes Requested"
        MARKS_PUBLISHED = "MARKS_PUBLISHED", "Marks Published"
        ANNOUNCEMENT = "ANNOUNCEMENT", "Announcement"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.ANNOUNCEMENT
    )
    related_link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"To {self.recipient.name}: {self.title}"


class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages"
    )
    subject = models.CharField(max_length=200, blank=True, default="Project Guidance & Discussion")
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Msg from {self.sender.name} to {self.recipient.name}: {self.subject}"


class ActivityLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities"
    )
    action = models.CharField(max_length=255)
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        actor_name = self.actor.name if self.actor else "System"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {actor_name}: {self.action}"
