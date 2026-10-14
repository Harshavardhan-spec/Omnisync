from django.db import models
from django.conf import settings

class Assessment(models.Model):
    class AssessmentType(models.TextChoices):
        REVIEW = "REVIEW", "Review"
        CIE = "CIE", "Continuous Internal Evaluation (CIE)"
        EXTERNAL = "EXTERNAL", "External Viva Voce"
        MID_TERM = "MID_TERM", "Mid-Term Evaluation"

    title = models.CharField(max_length=200, help_text="e.g. Review 3: Report Preparation and Presentation Review (RPPR)")
    code = models.CharField(max_length=20, help_text="e.g. R1, R2, R3, R4")
    assessment_type = models.CharField(
        max_length=30,
        choices=AssessmentType.choices,
        default=AssessmentType.CIE
    )
    semester = models.ForeignKey(
        "departments.Semester",
        on_delete=models.CASCADE,
        related_name="assessments"
    )
    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.CASCADE,
        related_name="assessments"
    )
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=30.00, help_text="Weightage percentage")
    due_date = models.DateTimeField(null=True, blank=True)
    venue = models.CharField(max_length=150, blank=True, default="Room 3201 (IT Dept)")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date", "code"]

    def __str__(self):
        return f"{self.code}: {self.title} ({self.max_marks}M)"


class AssessmentResult(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="results"
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="assessment_results"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="assessment_scores"
    )
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="evaluated_assessments"
    )
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    feedback = models.TextField(blank=True)
    evaluated_at = models.DateTimeField(auto_now_add=True)
    is_moderated = models.BooleanField(default=True)

    class Meta:
        ordering = ["-evaluated_at"]
        constraints = [
            models.UniqueConstraint(fields=["assessment", "project", "student"], name="unique_student_assessment_result")
        ]

    def __str__(self):
        return f"{self.assessment.code} - {self.project.title}: {self.marks_obtained}/{self.assessment.max_marks}"
