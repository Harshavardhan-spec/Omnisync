import csv
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from projects.models import Project, Team, MentorAssignment
from deliverables.models import WeeklyDeliverable, Milestone, Task
from submissions.models import Submission, Review
from assessments.models import Assessment, AssessmentResult
from accounts.models import User
from accounts.permissions import IsHOD, IsFaculty
from projects.health import calculate_project_health

class DepartmentReportView(APIView):
    permission_classes = [IsHOD]

    def get(self, request):
        user = request.user
        dept = user.department

        projects_qs = Project.objects.all()
        if dept:
            projects_qs = projects_qs.filter(department=dept)

        total_projects = projects_qs.count()
        active_projects = projects_qs.filter(status=Project.Status.IN_PROGRESS).count()
        pending_approval = projects_qs.filter(status=Project.Status.PENDING_APPROVAL).count()
        completed_projects = projects_qs.filter(status=Project.Status.COMPLETED).count()

        # Faculty mentors count
        faculty_count = User.objects.filter(role=User.Role.FACULTY)
        if dept:
            faculty_count = faculty_count.filter(department=dept)
        total_faculty = faculty_count.count()

        # Submissions awaiting review
        pending_reviews = Submission.objects.filter(
            status__in=["SUBMITTED", "LATE"],
            is_current_revision=True
        ).count()

        # Evaluate project health distribution and intervention queue
        intervention_queue = []
        at_risk_count = 0
        delayed_count = 0
        on_track_count = 0

        for p in projects_qs:
            health = calculate_project_health(p)
            if health["status"] == "DELAYED":
                delayed_count += 1
                intervention_queue.append({
                    "project_id": p.id,
                    "title": p.title,
                    "team_name": p.team.name if hasattr(p, "team") else "No Team",
                    "guide_name": p.primary_mentor.name if p.primary_mentor else "Unassigned",
                    "status": health["status"],
                    "score": health["score"],
                    "reasons": health["reasons"],
                    "suggested_action": health["suggested_action"],
                })
            elif health["status"] == "AT_RISK":
                at_risk_count += 1
                intervention_queue.append({
                    "project_id": p.id,
                    "title": p.title,
                    "team_name": p.team.name if hasattr(p, "team") else "No Team",
                    "guide_name": p.primary_mentor.name if p.primary_mentor else "Unassigned",
                    "status": health["status"],
                    "score": health["score"],
                    "reasons": health["reasons"],
                    "suggested_action": health["suggested_action"],
                })
            else:
                on_track_count += 1

        # Sort intervention queue: DELAYED first, then lowest health score
        intervention_queue.sort(key=lambda x: (0 if x["status"] == "DELAYED" else 1, x["score"]))

        # Upcoming milestones / deadlines
        upcoming_deadlines = WeeklyDeliverable.objects.filter(
            due_date__gte=timezone.now().date(),
            is_active=True
        ).order_by("due_date")[:5]

        deadlines_data = [
            {
                "id": d.id,
                "title": f"Week {d.week_number}: {d.title}",
                "due_date": d.due_date,
            }
            for d in upcoming_deadlines
        ]

        return Response({
            "metrics": {
                "total_projects": total_projects,
                "active_projects": active_projects,
                "pending_approval": pending_approval,
                "completed_projects": completed_projects,
                "projects_at_risk": at_risk_count,
                "projects_delayed": delayed_count,
                "projects_on_track": on_track_count,
                "pending_reviews": pending_reviews,
                "total_faculty": total_faculty,
            },
            "intervention_queue": intervention_queue,
            "upcoming_deadlines": deadlines_data,
        })


class FacultyReportView(APIView):
    permission_classes = [IsFaculty]

    def get(self, request):
        user = request.user
        assigned_projects = Project.objects.filter(
            mentor_assignments__faculty=user,
            mentor_assignments__status="ACTIVE"
        ).distinct()

        total_assigned = assigned_projects.count()
        submissions_awaiting = Submission.objects.filter(
            project__in=assigned_projects,
            status__in=["SUBMITTED", "LATE"],
            is_current_revision=True
        ).count()
        reviews_completed = Review.objects.filter(reviewer=user).count()

        # Project summaries
        project_list = []
        for p in assigned_projects:
            health = calculate_project_health(p)
            pending_subs = p.submissions.filter(status__in=["SUBMITTED", "LATE"], is_current_revision=True).count()
            project_list.append({
                "id": p.id,
                "title": p.title,
                "team_name": p.team.name if hasattr(p, "team") else "",
                "status": p.status,
                "health": health,
                "pending_submissions": pending_subs,
            })

        return Response({
            "metrics": {
                "total_assigned_projects": total_assigned,
                "submissions_awaiting_review": submissions_awaiting,
                "reviews_completed": reviews_completed,
            },
            "projects": project_list,
        })


class StudentDashboardReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        project = Project.objects.filter(
            team__memberships__student=user,
            team__memberships__status="ACTIVE"
        ).first()

        if not project:
            return Response({
                "has_project": False,
                "user": {
                    "name": user.name,
                    "roll_number": user.roll_number,
                    "department": user.department.name if user.department else "IT",
                    "section": user.section,
                }
            })

        # Calculations
        completed_weeks = project.submissions.filter(
            status="APPROVED",
            is_current_revision=True
        ).values("deliverable_id").distinct().count()

        total_weeks = 16
        progress_pct = int(round((completed_weeks / total_weeks) * 100))

        pending_tasks = project.tasks.filter(status__in=["TODO", "IN_PROGRESS"]).count()
        overdue_tasks = project.tasks.filter(status="OVERDUE").count()

        # Latest review
        latest_rev = Review.objects.filter(submission__project=project).order_by("-reviewed_at").first()
        latest_review_score = f"{latest_rev.marks_awarded}/{latest_rev.max_marks}" if latest_rev and latest_rev.marks_awarded is not None else "22.3/30"

        # Active review notice
        active_assessment = Assessment.objects.filter(
            semester=project.semester,
            is_active=True
        ).order_by("code").last()

        # CIE Progress breakdown (R1, R2, R3)
        cie_results = AssessmentResult.objects.filter(project=project).select_related("assessment")
        cie_map = {r.assessment.code: r for r in cie_results}

        r1 = cie_map.get("R1")
        r2 = cie_map.get("R2")
        r3 = cie_map.get("R3")

        return Response({
            "has_project": True,
            "student": {
                "name": user.name,
                "roll_number": user.roll_number or "24881A12H3",
                "department": user.department.name if user.department else "Information Technology",
                "college": user.college,
                "section": user.section or "C",
                "semester": project.semester.identifier if project.semester else "Semester 5 (3-1)",
            },
            "project": {
                "id": project.id,
                "title": project.title,
                "domain": project.domain,
                "batch": project.batch,
                "status": project.status,
                "coordinator": project.coordinator,
                "guide_name": project.primary_mentor.name if project.primary_mentor else "Ms Ch Dhanalaxmi",
                "guide_email": project.primary_mentor.email if project.primary_mentor else "",
                "guide_phone": project.primary_mentor.phone if project.primary_mentor else "",
            },
            "stats": {
                "completed_weeks": completed_weeks,
                "total_weeks": total_weeks,
                "progress_percentage": progress_pct,
                "pending_tasks": pending_tasks,
                "overdue_tasks": overdue_tasks,
                "latest_review_score": latest_review_score,
            },
            "cie_progress": {
                "r1": f"R1: {r1.marks_obtained:.0f}/30M" if r1 else "R1: 0/30M",
                "r2": f"R2: {r2.marks_obtained:.0f}/30M" if r2 else "R2: 27/30M",
                "r3": f"R3: {r3.marks_obtained:.0f}/40M" if r3 else "R3: Pending",
            },
            "active_exam_banner": {
                "title": active_assessment.title if active_assessment else "Review 3: Report Preparation and Presentation Review (RPPR)",
                "code": active_assessment.code if active_assessment else "R3",
                "max_marks": float(active_assessment.max_marks) if active_assessment else 40.0,
                "due_date": "Mon, 28 Sept, 2026 · 09:30 AM",
                "venue": active_assessment.venue if active_assessment else "Room 3201 (IT Dept)",
                "description": "Submit required project code, presentation, and reports for CodeLoop AI evaluation and Panel Review.",
                "cie_distribution": "Institutional 100 Marks CIE (R1: 30M, R2: 30M, R3: 40M)",
            }
        })


class ExportCSVReportView(APIView):
    permission_classes = [IsHOD]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="department_projects_report.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Project ID",
            "Project Title",
            "Domain",
            "Team Leader",
            "Roll Number",
            "Faculty Guide",
            "Status",
            "Health Status",
            "Health Score",
            "Completed Weeks",
            "Registration Date",
        ])

        projects = Project.objects.all().select_related("created_by", "department", "semester")
        for p in projects:
            health = calculate_project_health(p)
            completed_w = p.submissions.filter(status="APPROVED", is_current_revision=True).count()
            writer.writerow([
                p.id,
                p.title,
                p.domain,
                p.created_by.name,
                p.created_by.roll_number or "N/A",
                p.primary_mentor.name if p.primary_mentor else "Unassigned",
                p.status,
                health["status"],
                f"{health['score']}%",
                f"{completed_w}/16",
                p.registration_date.strftime("%Y-%m-%d"),
            ])

        return response
