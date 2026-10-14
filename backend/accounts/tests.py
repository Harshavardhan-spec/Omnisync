import json
from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from departments.models import Department, Semester
from projects.models import Project, Team, TeamMembership, MentorAssignment
from deliverables.models import WeeklyDeliverable, Task
from submissions.models import Submission, Review
from assessments.models import Assessment, AssessmentResult

class OmnisyncBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Department & Semester
        self.dept = Department.objects.create(name="Information Technology", code="IT")
        self.semester = Semester.objects.create(
            academic_year="2026-2027",
            identifier="Semester 5 (3-1)",
            start_date=date(2026, 7, 1),
            end_date=date(2026, 12, 15)
        )

        # Users
        self.hod = User.objects.create_user(
            email="hod.it@vardhaman.edu",
            name="Dr. K. Srinivas Rao",
            role=User.Role.HOD,
            department=self.dept,
            password="Password@123"
        )
        self.dept.hod = self.hod
        self.dept.save()

        self.faculty1 = User.objects.create_user(
            email="faculty1@vardhaman.edu",
            name="Ms Ch Dhanalaxmi",
            role=User.Role.FACULTY,
            department=self.dept,
            password="Password@123"
        )
        self.faculty2 = User.objects.create_user(
            email="faculty2@vardhaman.edu",
            name="Dr. Unassigned Guide",
            role=User.Role.FACULTY,
            department=self.dept,
            password="Password@123"
        )

        self.student1 = User.objects.create_user(
            email="student1@vardhaman.edu",
            name="Saddi Amulya Reddy",
            role=User.Role.STUDENT,
            department=self.dept,
            roll_number="24881A12H3",
            password="Password@123"
        )
        self.student2 = User.objects.create_user(
            email="student2@vardhaman.edu",
            name="Other Team Student",
            role=User.Role.STUDENT,
            department=self.dept,
            roll_number="24881A1299",
            password="Password@123"
        )

        # Project 1 (Owned by student 1, mentored by faculty 1)
        self.project1 = Project.objects.create(
            title="Powerblind+ Anomaly Detection",
            objective="Smart Meter Anomaly Detection",
            description="Deep learning telemetry analysis",
            semester=self.semester,
            department=self.dept,
            created_by=self.student1,
            status=Project.Status.APPROVED
        )
        self.team1 = Team.objects.create(name="Team Alpha", project=self.project1, leader=self.student1)
        TeamMembership.objects.create(team=self.team1, student=self.student1, role=TeamMembership.Role.LEADER, status="ACTIVE")

        MentorAssignment.objects.create(
            project=self.project1,
            faculty=self.faculty1,
            status="ACTIVE",
            is_primary=True
        )

        # Weekly Deliverable
        self.deliverable1 = WeeklyDeliverable.objects.create(
            department=self.dept,
            semester=self.semester,
            week_number=1,
            title="Problem Formulation & Survey",
            required_deliverables=["Problem Statement (PDF)"],
            due_date=date.today() + timedelta(days=5),
            maximum_marks=10.00
        )

    # 1. AUTHENTICATION TESTS
    def test_login_successful(self):
        resp = self.client.post("/api/auth/login/", {"email": "hod.it@vardhaman.edu", "password": "Password@123"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertEqual(resp.data["user"]["role"], "HOD")
        self.assertEqual(resp.data["redirect_path"], "/hod")

    def test_login_invalid_credentials(self):
        resp = self.client.post("/api/auth/login/", {"email": "hod.it@vardhaman.edu", "password": "WrongPassword"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        login_resp = self.client.post("/api/auth/login/", {"email": "hod.it@vardhaman.edu", "password": "Password@123"})
        refresh_token = login_resp.data["refresh"]
        refresh_resp = self.client.post("/api/auth/token/refresh/", {"refresh": refresh_token})
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)

    # 2. AUTHORIZATION & ROLE ISOLATION
    def test_student_cannot_approve_project(self):
        self.client.force_authenticate(user=self.student1)
        resp = self.client.post(f"/api/projects/{self.project1.id}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_hod_can_approve_project(self):
        unapproved = Project.objects.create(
            title="Pending Project",
            objective="Testing",
            description="Testing",
            semester=self.semester,
            department=self.dept,
            created_by=self.student1,
            status=Project.Status.PENDING_APPROVAL
        )
        self.client.force_authenticate(user=self.hod)
        resp = self.client.post(f"/api/projects/{unapproved.id}/approve/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        unapproved.refresh_from_db()
        self.assertEqual(unapproved.status, Project.Status.APPROVED)

    def test_unassigned_faculty_cannot_review_submission(self):
        # Create submission
        sub = Submission.objects.create(
            project=self.project1,
            deliverable=self.deliverable1,
            team=self.team1,
            submitted_by=self.student1,
            status="SUBMITTED"
        )
        # Faculty 2 is NOT assigned to project1
        self.client.force_authenticate(user=self.faculty2)
        resp = self.client.post(f"/api/submissions/{sub.id}/review/", {
            "outcome": "APPROVED",
            "feedback": "Unauthorized review attempt",
            "marks_awarded": 25.0
        })
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_assigned_faculty_can_review_submission(self):
        sub = Submission.objects.create(
            project=self.project1,
            deliverable=self.deliverable1,
            team=self.team1,
            submitted_by=self.student1,
            status="SUBMITTED"
        )
        self.client.force_authenticate(user=self.faculty1)
        resp = self.client.post(f"/api/submissions/{sub.id}/review/", {
            "outcome": "APPROVED",
            "feedback": "Excellent problem formulation.",
            "marks_awarded": 28.0,
            "max_marks": 30.0
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        sub.refresh_from_db()
        self.assertEqual(sub.status, "APPROVED")
        self.assertEqual(sub.reviews.count(), 1)
        self.assertEqual(sub.reviews.first().marks_awarded, Decimal("28.0"))

    # 3. SUBMISSION VALIDATION & REVISION HISTORY
    def test_submission_file_upload_and_revision(self):
        self.client.force_authenticate(user=self.student1)
        test_file = SimpleUploadedFile("report.pdf", b"%PDF-1.4 sample content", content_type="application/pdf")

        resp = self.client.post("/api/submissions/", {
            "project": self.project1.id,
            "deliverable": self.deliverable1.id,
            "notes": "Initial draft submission",
            "repo_url": "https://github.com/test/project",
            "files": [test_file]
        }, format="multipart")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["revision_number"], 1)

        # Now submit revision 2
        test_file2 = SimpleUploadedFile("report_v2.pdf", b"%PDF-1.4 revised content", content_type="application/pdf")
        resp2 = self.client.post("/api/submissions/", {
            "project": self.project1.id,
            "deliverable": self.deliverable1.id,
            "notes": "Revised submission with mentor feedback applied",
            "files": [test_file2]
        }, format="multipart")

        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp2.data["revision_number"], 2)

        # Check that revision 1 is preserved and marked not current
        rev1 = Submission.objects.get(project=self.project1, deliverable=self.deliverable1, revision_number=1)
        self.assertFalse(rev1.is_current_revision)

    def test_submission_rejects_unsupported_file_extension(self):
        self.client.force_authenticate(user=self.student1)
        bad_file = SimpleUploadedFile("danger.exe", b"executable bytes", content_type="application/octet-stream")
        resp = self.client.post("/api/submissions/", {
            "project": self.project1.id,
            "deliverable": self.deliverable1.id,
            "files": [bad_file]
        }, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not supported", resp.data["detail"])

    # 4. GRADEBOOK DYNAMIC CALCULATION
    def test_gradebook_weighted_calculation(self):
        # Assessment 1: Max 30, Weightage 30%
        a1 = Assessment.objects.create(
            title="Review 1",
            code="R1",
            semester=self.semester,
            department=self.dept,
            max_marks=30.00,
            weightage=30.00
        )
        # Assessment 2: Max 30, Weightage 30%
        a2 = Assessment.objects.create(
            title="Review 2",
            code="R2",
            semester=self.semester,
            department=self.dept,
            max_marks=30.00,
            weightage=30.00
        )
        # Results: 30/30 on R1 (100%), 15/30 on R2 (50%)
        AssessmentResult.objects.create(
            assessment=a1,
            project=self.project1,
            student=self.student1,
            evaluator=self.faculty1,
            marks_obtained=30.00
        )
        AssessmentResult.objects.create(
            assessment=a2,
            project=self.project1,
            student=self.student1,
            evaluator=self.faculty1,
            marks_obtained=15.00
        )

        self.client.force_authenticate(user=self.student1)
        resp = self.client.get("/api/assessments/gradebook/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Expected:
        # R1 contrib = (30/30) * 30 = 30.0
        # R2 contrib = (15/30) * 30 = 15.0
        # Total evaluated weightage = 60.0
        # Overall percentage = (45 / 60) * 100 = 75.0% -> "A (Very Good)"
        self.assertEqual(resp.data["cumulative_score"], 45.0)
        self.assertEqual(resp.data["overall_percentage"], 75.0)
        self.assertEqual(resp.data["final_grade"], "A (Very Good)")
