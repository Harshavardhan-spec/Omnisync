from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from deliverables.models import Task, WeeklyDeliverable
from notifications.models import Notification

class Command(BaseCommand):
    help = "Check upcoming deliverable deadlines and overdue tasks, dispatching notifications without duplicates."

    def handle(self, *args, **options):
        today = timezone.now().date()
        reminder_window = today + timedelta(days=3)
        self.stdout.write(f"Running deadline check for date: {today} (Window: {reminder_window})")

        created_count = 0

        # 1. Check Weekly Deliverables due within 3 days
        upcoming_deliverables = WeeklyDeliverable.objects.filter(
            due_date__gte=today,
            due_date__lte=reminder_window,
            is_active=True
        )

        for deliv in upcoming_deliverables:
            # Find all students who haven't submitted yet
            from projects.models import Project
            projects = Project.objects.filter(
                status__in=[Project.Status.APPROVED, Project.Status.IN_PROGRESS]
            )
            for proj in projects:
                has_submitted = proj.submissions.filter(
                    deliverable=deliv,
                    is_current_revision=True,
                    status__in=["SUBMITTED", "APPROVED", "UNDER_REVIEW"]
                ).exists()

                if not has_submitted and hasattr(proj, "team"):
                    for m in proj.team.memberships.filter(status="ACTIVE"):
                        student = m.student
                        # Prevent duplicate notification for same deliverable and student
                        title = f"Upcoming Deadline: Week {deliv.week_number} Deliverables"
                        exists = Notification.objects.filter(
                            recipient=student,
                            title=title,
                            created_at__date=today
                        ).exists()
                        if not exists:
                            Notification.objects.create(
                                recipient=student,
                                title=title,
                                message=f"Week {deliv.week_number} ({deliv.title}) is due on {deliv.due_date}. Please submit required deliverables.",
                                notification_type=Notification.Type.DEADLINE_UPCOMING,
                                related_link="/student/weekly-deliverables"
                            )
                            created_count += 1

        # 2. Check Overdue Tasks
        overdue_tasks = Task.objects.filter(
            due_date__lt=today,
            status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS]
        )

        for task in overdue_tasks:
            task.status = Task.Status.OVERDUE
            task.save()

            if task.assigned_to:
                title = f"Task Overdue: {task.title}"
                exists = Notification.objects.filter(
                    recipient=task.assigned_to,
                    title=title,
                    created_at__date=today
                ).exists()
                if not exists:
                    Notification.objects.create(
                        recipient=task.assigned_to,
                        title=title,
                        message=f"Task '{task.title}' was due on {task.due_date} and is now marked OVERDUE.",
                        notification_type=Notification.Type.TASK_OVERDUE,
                        related_link="/student/tasks"
                    )
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Deadline check complete. Dispatched {created_count} new notifications."))
