import os
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from departments.models import Department, Semester
from projects.models import Project, Team, TeamMembership, MentorAssignment
from deliverables.models import Milestone, WeeklyDeliverable, Task
from submissions.models import Submission, Review
from assessments.models import Assessment, AssessmentResult
from notifications.models import Notification, ActivityLog

User = get_user_model()

class Command(BaseCommand):
    help = "Seed initial development and demonstration data for Omnisync Capstone"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Omnisync database...")

        # 1. Department
        dept, _ = Department.objects.get_or_create(
            code="IT",
            defaults={"name": "Information Technology"}
        )

        # 2. Semester
        semester, _ = Semester.objects.get_or_create(
            identifier="Semester 5 (3-1)",
            academic_year="2026-2027",
            defaults={
                "start_date": date(2026, 7, 1),
                "end_date": date(2026, 12, 15),
                "is_active": True
            }
        )

        # 3. Users
        # HOD
        hod_user, created = User.objects.get_or_create(
            email="hod.it@vardhaman.edu",
            defaults={
                "name": "Dr. K. Srinivas Rao",
                "role": User.Role.HOD,
                "department": dept,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created:
            hod_user.set_password("Password@123")
            hod_user.save()
        dept.hod = hod_user
        dept.save()

        # Faculty Guide
        guide_user, created = User.objects.get_or_create(
            email="dhanalaxmi@vardhaman.edu",
            defaults={
                "name": "Ms Ch Dhanalaxmi",
                "role": User.Role.FACULTY,
                "department": dept,
                "phone": "+91 9876543210",
                "is_staff": True,
            }
        )
        if created:
            guide_user.set_password("Password@123")
            guide_user.save()

        # Faculty 2 (Coordinator)
        coord_user, created = User.objects.get_or_create(
            email="prashanthi@vardhaman.edu",
            defaults={
                "name": "Ms T Prashanthi",
                "role": User.Role.FACULTY,
                "department": dept,
                "is_staff": True,
            }
        )
        if created:
            coord_user.set_password("Password@123")
            coord_user.save()

        # Student 1 (Leader matching screenshots)
        student_user, created = User.objects.get_or_create(
            email="amulya.reddy@student.vardhaman.edu",
            defaults={
                "name": "Saddi Amulya Reddy",
                "role": User.Role.STUDENT,
                "department": dept,
                "roll_number": "24881A12H3",
                "section": "C",
                "college": "Vardhaman College of Engineering",
            }
        )
        if created:
            student_user.set_password("Password@123")
            student_user.save()

        # Student 2 (Teammate)
        student2_user, created = User.objects.get_or_create(
            email="rohan.sharma@student.vardhaman.edu",
            defaults={
                "name": "B. Rohan Sharma",
                "role": User.Role.STUDENT,
                "department": dept,
                "roll_number": "24881A12J1",
                "section": "C",
                "college": "Vardhaman College of Engineering",
            }
        )
        if created:
            student2_user.set_password("Password@123")
            student2_user.save()

        # 4. Project
        project, _ = Project.objects.get_or_create(
            title="Powerblind+: An Explainable Smart Meter Anomaly Detection and Decision Support System",
            defaults={
                "objective": "Design an explainable machine learning system to detect anomalies in smart electricity meters using deep neural networks and SHAP interpretable feature attributions.",
                "description": "Comprehensive IoT smart grid anomaly detection pipeline handling raw AMI time series telemetry with robust security auditing, automated alert dispatching, and faculty panel verification.",
                "domain": "Data Science",
                "semester": semester,
                "department": dept,
                "batch": "BATCH 2024120248",
                "coordinator": "Ms T Prashanthi",
                "status": Project.Status.IN_PROGRESS,
                "created_by": student_user,
            }
        )

        # 5. Team & Memberships
        team, _ = Team.objects.get_or_create(
            project=project,
            defaults={
                "name": "Powerblind AI Core Team",
                "leader": student_user,
                "max_members": 4,
            }
        )

        TeamMembership.objects.get_or_create(
            team=team,
            student=student_user,
            defaults={"role": TeamMembership.Role.LEADER, "responsibility": "System Architecture, Deep Learning Model & Dashboard"}
        )
        TeamMembership.objects.get_or_create(
            team=team,
            student=student2_user,
            defaults={"role": TeamMembership.Role.MEMBER, "responsibility": "Data Pipeline, Preprocessing & API Backend"}
        )

        # 6. Mentor Assignment
        MentorAssignment.objects.get_or_create(
            project=project,
            faculty=guide_user,
            defaults={
                "assigned_by": hod_user,
                "is_primary": True,
                "status": MentorAssignment.Status.ACTIVE,
            }
        )

        # 7. 16 Weekly Deliverables
        week_templates = [
            (1, "Problem Formulation & Literature Survey", ["1 Problem Statement Document (PDF)", "2 Domain Feasibility Study", "3 Survey of 5 Base IEEE Papers"], date(2026, 7, 28)),
            (2, "SRS & High-Level Architecture", ["1 Software Requirement Specification Document", "2 System Context Diagram", "3 Functional Decomposition"], date(2026, 8, 4)),
            (3, "Module Decomposition & Interface Spec", ["1 Module Architecture Document", "2 REST API Endpoint Contracts", "3 Sequence Diagrams"], date(2026, 8, 11)),
            (4, "Methodology & Algorithm Blueprint", ["1 Algorithm Mathematical Formulation", "2 Model Selection Justification", "3 Dataset Profiling Report"], date(2026, 8, 18)),
            (5, "Core Model / Backend Pipeline Setup", ["1 GitHub Repository Link", "2 ETL Pipeline Script", "3 Initial Baseline Model Checkpoint"], date(2026, 8, 25)),
            (6, "Database Schema & Data Preprocessing", ["1 ER Diagram & Relational Schemas", "2 Preprocessed Dataset Sample", "3 Data Cleaning Logs"], date(2026, 9, 1)),
            (7, "Frontend UI/UX & Component Wireframes", ["1 Figma / UI Mockups Link", "2 Component Hierarchy Chart", "3 Tailwind Design Tokens"], date(2026, 9, 8)),
            (8, "Prototype Implementation & Mid-Review Demo", ["1 Working Prototype Demo Video", "2 Mid-term Presentation Deck (PPTX)", "3 Codebase Release Tag v0.1"], date(2026, 9, 15)),
            (9, "Advanced Algorithm Optimization & Hyperparameters", ["1 Hyperparameter Tuning Matrix", "2 Validation Loss Curves", "3 Model Serialization Artifacts"], date(2026, 9, 22)),
            (10, "System Testing & Validation Benchmarks", ["1 Unit & Integration Test Suite", "2 Test Coverage Report (>80%)", "3 Confusion Matrix & F1 Scores"], date(2026, 9, 29)),
            (11, "Security Audit & Performance Profiling", ["1 API Penetration & Input Validation Report", "2 Latency & Load Benchmarks", "3 Security Hardening Log"], date(2026, 10, 6)),
            (12, "Full System Integration & Field Testing", ["1 End-to-End Integrated Live Link", "2 User Acceptance Testing Document", "3 Anomaly Alert Demonstration"], date(2026, 10, 13)),
            (13, "Draft Thesis & IEEE Paper Draft", ["1 IEEE Conference Format Manuscript", "2 Turnitin Plagiarism Report (<10%)", "3 Reference Citations BibTeX"], date(2026, 10, 20)),
            (14, "Final Report Review & Faculty Corrections", ["1 Revised Capstone Report Draft", "2 Compliance Checklist Sign-off", "3 Guide Feedback Action Report"], date(2026, 10, 27)),
            (15, "Poster Presentation & Video Walkthrough", ["1 High-Resolution Academic Poster (A1)", "2 3-Minute Video Showcase URL", "3 Executive Summary Brochure"], date(2026, 11, 3)),
            (16, "Final Project Book & External Viva Voce", ["1 Hardbound Capstone Thesis PDF", "2 Complete Source Code ZIP & GitHub Release", "3 Project Completion Certificate Draft"], date(2026, 11, 10)),
        ]

        for w_num, title, deliverables_list, due in week_templates:
            WeeklyDeliverable.objects.get_or_create(
                department=dept,
                semester=semester,
                week_number=w_num,
                defaults={
                    "title": title,
                    "description": f"Mandatory deliverables and milestone targets for Week {w_num}.",
                    "required_deliverables": deliverables_list,
                    "due_date": due,
                    "maximum_marks": 10.00,
                    "is_active": True,
                }
            )

        # 8. Milestones (4 Review Milestones)
        milestones = [
            ("Review 1: Conceptual Design", "Evaluation of problem statement, literature survey, and feasibility.", date(2026, 8, 18), 30.00, 1),
            ("Review 2: Prototype & Demo", "Evaluation of system architecture, prototype code, and initial metrics.", date(2026, 9, 15), 30.00, 2),
            ("Review 3: Integration & Thesis (RPPR)", "Report preparation, panel presentation, and explainability evaluation.", date(2026, 9, 28), 40.00, 3),
            ("Review 4: External Viva Voce", "Final comprehensive project defense before University external examiner.", date(2026, 11, 15), 100.00, 4),
        ]
        for m_title, m_desc, m_due, m_marks, order in milestones:
            Milestone.objects.get_or_create(
                department=dept,
                title=m_title,
                defaults={
                    "description": m_desc,
                    "due_date": m_due,
                    "weightage_marks": m_marks,
                    "status": Milestone.Status.COMPLETED if order <= 2 else Milestone.Status.PENDING,
                    "order": order,
                }
            )

        # 9. Assessments & Moderated Scores (matching the reference screenshots!)
        # CIE Institutional 100 Marks: R1 (30M), R2 (30M), R3 (40M)
        a1, _ = Assessment.objects.get_or_create(
            code="R1",
            semester=semester,
            department=dept,
            defaults={
                "title": "Review 1: Conceptual Design",
                "assessment_type": Assessment.AssessmentType.REVIEW,
                "max_marks": 30.00,
                "weightage": 30.00,
                "due_date": timezone.now() - timedelta(days=45),
                "venue": "Seminar Hall 1",
                "description": "Problem formulation, IEEE paper analysis, and architecture specifications.",
                "is_published": True,
            }
        )
        AssessmentResult.objects.get_or_create(
            assessment=a1,
            project=project,
            student=student_user,
            defaults={
                "evaluator": guide_user,
                "marks_obtained": 0.00,
                "feedback": "Initial review conceptual framing complete.",
                "is_moderated": True,
            }
        )

        a2, _ = Assessment.objects.get_or_create(
            code="R2",
            semester=semester,
            department=dept,
            defaults={
                "title": "Review 2: Prototype & Demo",
                "assessment_type": Assessment.AssessmentType.REVIEW,
                "max_marks": 30.00,
                "weightage": 30.00,
                "due_date": timezone.now() - timedelta(days=15),
                "venue": "Room 3201 (IT Dept)",
                "description": "Baseline algorithm execution and working model demonstration.",
                "is_published": True,
            }
        )
        AssessmentResult.objects.get_or_create(
            assessment=a2,
            project=project,
            student=student_user,
            defaults={
                "evaluator": guide_user,
                "marks_obtained": 27.00,
                "feedback": "Outstanding prototype execution. Model latency meets target specifications.",
                "is_moderated": True,
            }
        )

        a3, _ = Assessment.objects.get_or_create(
            code="R3",
            semester=semester,
            department=dept,
            defaults={
                "title": "Review 3: Report Preparation and Presentation Review (RPPR)",
                "assessment_type": Assessment.AssessmentType.CIE,
                "max_marks": 40.00,
                "weightage": 40.00,
                "due_date": timezone.now() + timedelta(days=5),
                "venue": "Room 3201 (IT Dept)",
                "description": "Submit required project code, presentation, and reports for CodeLoop AI evaluation and Panel Review.",
                "is_published": True,
            }
        )

        # 10. Sample Tasks
        Task.objects.get_or_create(
            project=project,
            title="Complete IEEE Paper Survey and Comparative Matrix",
            defaults={
                "description": "Synthesize 5 base IEEE papers comparing anomaly detection methods in smart grids.",
                "assigned_to": student_user,
                "priority": Task.Priority.HIGH,
                "status": Task.Status.TODO,
                "due_date": timezone.now().date() + timedelta(days=3),
            }
        )
        Task.objects.get_or_create(
            project=project,
            title="Implement Explainability SHAP Attributions Module",
            defaults={
                "description": "Produce tree SHAP and kernel explainer summary plots for anomalies.",
                "assigned_to": student2_user,
                "priority": Task.Priority.MEDIUM,
                "status": Task.Status.IN_PROGRESS,
                "due_date": timezone.now().date() + timedelta(days=7),
            }
        )

        # 11. Initial Notifications
        Notification.objects.get_or_create(
            recipient=student_user,
            title="Review 3: RPPR Deliverables Open",
            defaults={
                "message": "Review 3 (RPPR) examination is active. Upload your presentation deck and draft report before the scheduled date.",
                "notification_type": Notification.Type.DEADLINE_UPCOMING,
                "related_link": "/student/weekly-deliverables",
            }
        )

        # 12. Activity Log
        ActivityLog.objects.create(
            actor=hod_user,
            action="Approved project registration for 'Powerblind+' and assigned guide Ms Ch Dhanalaxmi",
            project=project,
            metadata={"status": "APPROVED", "guide_id": guide_user.id}
        )

        self.stdout.write(self.style.SUCCESS("Database successfully seeded with realistic academic records!"))
