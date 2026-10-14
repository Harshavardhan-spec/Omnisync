from django.utils import timezone
from datetime import timedelta

def calculate_project_health(project):
    """
    Evaluates explainable rule-based project health.
    Returns:
    {
        "status": "ON_TRACK" | "AT_RISK" | "DELAYED",
        "score": 0 - 100,
        "reasons": [str, ...],
        "suggested_action": str
    }
    """
    today = timezone.now().date()
    reasons = []
    penalty = 0

    # 1. Overdue Tasks
    overdue_tasks = project.tasks.filter(
        due_date__lt=today,
        status__in=["TODO", "IN_PROGRESS", "OVERDUE"]
    ).count()

    if overdue_tasks > 0:
        penalty += overdue_tasks * 15
        reasons.append(f"{overdue_tasks} task(s) are overdue past their deadline.")

    # 2. Incomplete Milestones Due Soon
    imminent_milestones = project.milestones.filter(
        status="PENDING",
        due_date__lte=today + timedelta(days=5),
        due_date__gte=today
    ).count()
    if imminent_milestones > 0:
        penalty += 10
        reasons.append(f"{imminent_milestones} milestone deadline is approaching within 5 days.")

    # 3. Repeated Changes Requested in Submissions
    changes_req = project.submissions.filter(status="CHANGES_REQUESTED").count()
    if changes_req > 0:
        penalty += changes_req * 10
        reasons.append(f"Faculty requested revisions for {changes_req} deliverable(s).")

    # 4. Late Submissions
    late_submissions = project.submissions.filter(is_late=True).count()
    if late_submissions > 0:
        penalty += late_submissions * 10
        reasons.append(f"{late_submissions} deliverable(s) were submitted past deadline.")

    # Determine status & suggested action
    health_score = max(0, 100 - penalty)
    if penalty >= 35 or overdue_tasks >= 2:
        status = "DELAYED"
        suggested_action = "Schedule urgent intervention with Project Guide and revise deliverable schedule."
    elif penalty >= 15 or imminent_milestones > 0 or overdue_tasks == 1:
        status = "AT_RISK"
        suggested_action = "Review task assignments and arrange mentor check-in to clear roadblocks."
    else:
        status = "ON_TRACK"
        suggested_action = "Project is progressing on schedule according to academic deliverables."
        if not reasons:
            reasons.append("All milestones and weekly deliverables are on schedule.")

    return {
        "status": status,
        "score": health_score,
        "reasons": reasons,
        "suggested_action": suggested_action,
        "overdue_tasks_count": overdue_tasks,
    }
