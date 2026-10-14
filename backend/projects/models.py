from django.db import models
from django.conf import settings

class Project(models.Model):
    class Status(models.TextChoices):
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
        APPROVED = "APPROVED", "Approved"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        ON_HOLD = "ON_HOLD", "On Hold"
        COMPLETED = "COMPLETED", "Completed"
        REJECTED = "REJECTED", "Rejected"

    title = models.CharField(max_length=255)
    objective = models.TextField()
    description = models.TextField()
    domain = models.CharField(max_length=100, default="Data Science")
    semester = models.ForeignKey(
        "departments.Semester",
        on_delete=models.PROTECT,
        related_name="projects"
    )
    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.PROTECT,
        related_name="projects"
    )
    batch = models.CharField(max_length=50, default="BATCH 2024120248")
    coordinator = models.CharField(max_length=150, blank=True, default="Ms T Prashanthi")
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_APPROVAL
    )
    rejection_reason = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_projects"
    )
    registration_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-registration_date"]

    def __str__(self):
        return f"{self.title} [{self.get_status_display()}]"

    @property
    def primary_mentor(self):
        assignment = self.mentor_assignments.filter(status="ACTIVE", is_primary=True).first()
        return assignment.faculty if assignment else None


class Team(models.Model):
    name = models.CharField(max_length=150)
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="team",
        null=True,
        blank=True
    )
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="led_teams"
    )
    max_members = models.PositiveIntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Leader: {self.leader.name})"


class TeamMembership(models.Model):
    class Role(models.TextChoices):
        LEADER = "LEADER", "Team Leader"
        MEMBER = "MEMBER", "Member"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INVITED = "INVITED", "Invited"
        REMOVED = "REMOVED", "Removed"

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="memberships"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_memberships"
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER
    )
    responsibility = models.CharField(max_length=255, blank=True, default="Full Stack & Core Module")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["team", "student"], name="unique_team_membership")
        ]

    def __str__(self):
        return f"{self.student.name} - {self.team.name} ({self.role})"


class MentorAssignment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="mentor_assignments"
    )
    faculty = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_mentorships"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentors_assigned"
    )
    is_primary = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.faculty.name} -> {self.project.title} ({self.status})"
