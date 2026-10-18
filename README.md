
DejaVu_Hack
<div align="center">

# OmniSync

### Academic Project Lifecycle & Evaluation Platform

**One workspace for project proposals, team collaboration, weekly deliverables, faculty reviews, assessments, and department-level oversight.**

</div>

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Goals](#3-goals)
- [4. User Roles and Permissions](#4-user-roles-and-permissions)
- [5. Features](#5-features)
- [6. End-to-End Workflow](#6-end-to-end-workflow)
- [7. Technology Stack](#7-technology-stack)
- [8. Architecture](#8-architecture)
- [9. Repository Structure](#9-repository-structure)
- [10. Data Model](#10-data-model)
- [11. Prerequisites](#11-prerequisites)
- [12. Local Installation](#12-local-installation)
- [13. Environment Configuration](#13-environment-configuration)
- [14. Running the Application](#14-running-the-application)
- [15. Demo Data](#15-demo-data)
- [16. Frontend Routes](#16-frontend-routes)
- [17. REST API Reference](#17-rest-api-reference)
- [18. Authentication and Access Control](#18-authentication-and-access-control)
- [19. Submission and Review Lifecycle](#19-submission-and-review-lifecycle)
- [20. Deadline Checks and Reports](#20-deadline-checks-and-reports)
- [21. File Uploads](#21-file-uploads)
- [22. Development and Validation](#22-development-and-validation)
- [23. Troubleshooting](#23-troubleshooting)
- [24. Production Readiness and Security](#24-production-readiness-and-security)
- [25. Contributing](#25-contributing)
- [26. License](#26-license)

---

## 1. Project Overview

**OmniSync** is a role-based academic project management platform built to support the lifecycle of student projects in a college or academic department. It brings students, faculty guides, and Heads of Department (HODs) into one application so project progress, milestones, submissions, feedback, and marks can be managed consistently.

The repository contains two applications:

- **Frontend:** a React single-page application that provides role-specific dashboards and workflows.
- **Backend:** a Django REST Framework API that handles authentication, business rules, data persistence, permissions, submissions, reviews, notifications, and reporting.

The backend is organized into Django apps by business domain. The frontend communicates with the API through Axios, and Vite proxies `/api` and `/media` requests to the local Django server during development.

### At a glance

| Item | Details |
| --- | --- |
| Project name | OmniSync |
| Application type | Full-stack web application |
| Primary use case | Academic project coordination and evaluation |
| Frontend | React, Vite, React Router |
| Backend | Python, Django, Django REST Framework |
| Authentication | JSON Web Tokens (JWT) and Django session authentication |
| Database | PostgreSQL configuration by default; SQLite can be configured for local development |
| Main user roles | Student, Faculty/Guide, Head of Department |
| Local frontend URL | `http://localhost:5173` |
| Local backend URL | `http://127.0.0.1:8000` |

## 2. Problem Statement

Academic project work often involves several disconnected activities: forming teams, registering project proposals, assigning faculty guides, publishing weekly requirements, collecting deliverables, reviewing work, recording marks, and monitoring deadlines. When these activities are tracked across spreadsheets, messages, and separate documents, it becomes difficult to maintain a shared and reliable view of project progress.

OmniSync provides a centralized workflow for these activities. It gives each role a relevant workspace and keeps project data, submissions, review outcomes, assessment records, notifications, and activity history in a common system.

## 3. Goals

- Centralize project and team information.
- Establish a clear approval and mentor-assignment workflow.
- Make weekly deliverables, tasks, milestones, and due dates visible.
- Keep submission revisions and review outcomes traceable.
- Provide structured assessment marks and feedback.
- Give faculty a focused view of assigned projects and pending reviews.
- Help department leadership identify project risks and monitor activity.
- Reduce manual coordination through in-app notifications and reporting.

## 4. User Roles and Permissions

OmniSync defines three application roles. Actual API permissions are enforced by backend views and permission classes; frontend route guards are an additional usability layer, not a substitute for backend authorization.

| Role | Primary responsibilities | Main workspace |
| --- | --- | --- |
| **Student** | View project and team information, follow tasks and weekly deliverables, submit work, review feedback and marks, and use the shared inbox. | `/student` |
| **Faculty / Guide** | Monitor assigned projects, inspect student submissions, review work, provide feedback, and participate in assessment workflows. | `/faculty` |
| **Head of Department (HOD)** | Oversee department projects, approve or reject proposals, manage users and deliverable configuration, review audit history, and monitor reports. | `/hod` |

The exact actions available to a user depend on the role checks and queryset filtering implemented by the backend. For example, students generally see submissions associated with their active team membership, faculty see submissions for projects assigned to them, and HOD users have broader oversight.

## 5. Features

### 5.1 Authentication and user management
- Email-based sign-in.
- JWT access and refresh tokens.
- Endpoint for retrieving and updating the authenticated user's profile.
- HOD-controlled user provisioning.
- User roles, department association, roll number, section, phone, college, and optional avatar fields.
- Django Admin for authorized administrative operations.

### 5.2 Departments and semesters
- Department records with a unique name and code.
- Optional HOD association for each department.
- Semester records with academic year, identifier, start/end dates, and active state.
- Department and semester relationships used to organize projects, deliverables, and assessments.

### 5.3 Project proposals and approvals
- Project title, objective, description, domain, department, semester, batch, coordinator, creator, and status.
- Proposal states include pending approval, approved, in progress, on hold, completed, and rejected.
- HOD actions to approve or reject projects.
- Rejection reason tracking.
- Faculty mentor assignments, including primary mentor designation and active/inactive status.

### 5.4 Teams and memberships
- Team associated with a project.
- Team leader and configurable maximum member count.
- Student memberships with leader/member roles, responsibilities, and active/invited/removed states.
- Actions for adding and removing team members.
- Unique membership constraint preventing duplicate membership rows for the same student and team.

### 5.5 Milestones, weekly deliverables, and tasks
- Project-specific or department-level milestones.
- Weekly deliverables associated with departments, semesters, or individual projects.
- Required deliverable lists, due dates, active status, and maximum marks.
- Tasks linked to a project and optionally to a milestone or weekly deliverable.
- Task assignment, priority, status, due date, and completion timestamp.
- Task priorities: low, medium, high, and urgent.
- Task states: to do, in progress, completed, and overdue.

### 5.6 Submissions, attachments, and revisions
- Submission notes, repository URL, demo URL, and additional links.
- File attachments with recorded filename, type, size, and upload timestamp.
- Revision numbering and a flag identifying the current revision.
- Deadline-based late-submission marking.
- Submission states: not started, draft, submitted, under review, changes requested, approved, rejected, and late.
- Revision history available with submission details.

### 5.7 Reviews and feedback
- Faculty review records linked to submissions.
- Review outcomes: pending, approved, changes requested, and rejected.
- Written feedback, marks awarded, maximum marks, reviewer, and review timestamp.
- Latest review details included in submission responses.

### 5.8 Assessments and gradebook
- Assessment definitions scoped to a department and semester.
- Assessment types: review, Continuous Internal Evaluation (CIE), external viva voce, and mid-term evaluation.
- Maximum marks, weightage, due date, venue, description, active status, and publication status.
- Assessment results associated with projects and optionally individual students.
- Evaluator, marks obtained, feedback, evaluation timestamp, and moderation state.
- Gradebook endpoint for assessment-oriented views.

### 5.9 Notifications, messaging, and activity history
- In-app notifications for events such as project approval, mentor assignment, task assignment, approaching deadlines, overdue tasks, submission receipt, completed reviews, requested changes, and published marks.
- Read/unread state and related navigation links.
- Actions for marking a notification as read, marking all notifications as read, and retrieving unread counts.
- Direct messages between users, optionally linked to a project.
- Activity log entries with actor, action, project, timestamp, and structured metadata.

### 5.10 Dashboards and reporting
- Student, faculty, and HOD dashboards.
- Department-level project metrics and project health indicators.
- Faculty overview of assigned projects and submissions awaiting review.
- Student dashboard reporting.
- CSV report export endpoint.
- HOD audit-history interface.

> The README documents capabilities found in the repository. The availability and behavior of each operation remain governed by the implementation and permissions of the corresponding API endpoint.

## 6. End-to-End Workflow

A typical project lifecycle can be understood as follows:

1. **Set up the academic context.** Department and semester records establish the organizational scope.
2. **Create users.** Students, faculty, and HOD accounts are provisioned and assigned the appropriate roles and department.
3. **Register a project.** A project proposal records its title, objective, description, domain, semester, department, and creator.
4. **Review the proposal.** An HOD can approve or reject the proposal. A rejection can include a reason.
5. **Organize the team and mentor.** Team membership and faculty mentor assignments connect students and guides to the project.
6. **Define project work.** Milestones, weekly deliverables, tasks, and due dates communicate expected work and timing.
7. **Submit deliverables.** Students submit notes, links, and permitted files. New submissions are versioned, and previous submissions for the same project and deliverable are marked as non-current.
8. **Review and respond.** Faculty review submissions, record an outcome, provide feedback, and optionally record marks.
9. **Assess performance.** Assessment definitions and results support evaluation and gradebook workflows.
10. **Monitor progress.** Notifications, activity history, dashboards, and reports help users follow project activity and identify items requiring attention.

The exact process can vary according to how administrators configure the project and which actions are enabled for each role.

## 7. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| UI library | React 19 | Component-based user interface |
| Development/build tool | Vite | Local development server and production bundling |
| Routing | React Router | Client-side navigation and role-specific route groups |
| Styling | Tailwind CSS 4 | Utility-first styling |
| Charts | Recharts | Dashboard data visualization |
| Icons | Lucide React | Interface icons |
| HTTP | Axios | API communication |
| Backend framework | Django | Server-side application and data model |
| API framework | Django REST Framework | REST endpoints, serializers, viewsets, permissions |
| Authentication | Simple JWT | JWT access and refresh tokens |
| CORS | django-cors-headers | Cross-origin request configuration |
| Database driver | psycopg | PostgreSQL connectivity |
| Configuration | python-dotenv | Load environment variables from `backend/.env` |

Frontend dependencies and scripts are declared in `frontend/package.json`. Backend dependencies are not currently pinned in a repository `requirements.txt`; the setup section below lists the packages required by the current code.

## 8. Architecture

```text
┌─────────────────────────────────────────────────────┐
│                    User's Browser                   │
│          React UI · React Router · Tailwind         │
└────────────────────────┬────────────────────────────┘
                         │ Axios requests (/api, /media)
                         ▼
┌─────────────────────────────────────────────────────┐
│                Vite Development Proxy               │
│                    localhost:5173                   │
└────────────────────────┬────────────────────────────┘
                         │ forwards to Django
                         ▼
┌─────────────────────────────────────────────────────┐
│              Django REST Framework API              │
│                                                     │
│ Accounts · Departments · Projects · Deliverables   │
│ Submissions · Assessments · Notifications · Reports│
│                                                     │
│ Serializers · ViewSets · Permissions · JWT          │
└────────────────────────┬────────────────────────────┘
                         │ Django ORM
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Configured Database                 │
│          PostgreSQL by default / SQLite option      │
└─────────────────────────────────────────────────────┘
```

### Request lifecycle

1. The user interacts with a React page.
2. A service module in `frontend/src/services/` makes an HTTP request through Axios.
3. During development, Vite forwards `/api` and `/media` traffic to Django.
4. Django authenticates the request and applies the endpoint's permission and queryset rules.
5. A serializer validates incoming data or shapes outgoing data.
6. Django ORM reads or writes the configured database.
7. The API returns a response for the frontend to render.

### Main backend domains

| Django app | Responsibility |
| --- | --- |
| `accounts` | Custom user model, login, current-user profile, user listing/provisioning, role permissions, seed-data command |
| `departments` | Departments and semesters |
| `projects` | Projects, teams, team memberships, mentor assignments, project approval |
| `deliverables` | Milestones, weekly deliverables, tasks |
| `submissions` | Submission records, uploaded files, reviews, revisions |
| `assessments` | Assessment definitions, assessment results, gradebook |
| `notifications` | Notifications, messages, activity logs, deadline-check command |
| `reports` | Department, faculty, and student dashboard reports; CSV export |
| `config` | Django settings, root URL routing, ASGI and WSGI entry points |

## 9. Repository Structure

```text
Omnisync-main/
├── README.md
├── .gitignore
│
├── backend/
│   ├── manage.py
│   ├── .env                         # Create locally; do not commit secrets
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── accounts/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── permissions.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── management/commands/seed_data.py
│   ├── departments/
│   ├── projects/
│   ├── deliverables/
│   ├── submissions/
│   ├── assessments/
│   ├── notifications/
│   │   └── management/commands/check_deadlines.py
│   └── reports/
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── layout/
        │   ├── student/
        │   └── hod/
        ├── context/
        │   ├── AuthContext.jsx
        │   └── NotificationContext.jsx
        ├── pages/
        │   ├── auth/
        │   ├── common/
        │   ├── student/
        │   ├── faculty/
        │   └── hod/
        └── services/
            ├── api.js
            ├── authService.js
            ├── projectService.js
            ├── deliverableService.js
            ├── submissionService.js
            ├── assessmentService.js
            ├── notificationService.js
            └── reportService.js
```

Each backend app generally follows Django's model/serializer/view/URL pattern. The frontend separates pages, reusable layout components, context providers, and API service modules to keep UI and data access concerns distinct.

## 10. Data Model

The main entities and their relationships are summarized below.

| Entity | Purpose and relationships |
| --- | --- |
| `User` | Custom email-based user; has a role and optional department, and can be a student, faculty member, or HOD. |
| `Department` | Department identity and optional HOD; related to semesters, projects, milestones, deliverables, and assessments. |
| `Semester` | Academic year, semester identifier, date range, and active flag; scopes projects, deliverables, and assessments. |
| `Project` | Proposal and lifecycle status; belongs to a department and semester and is created by a user. |
| `Team` | Team associated with a project, with a leader and maximum member count. |
| `TeamMembership` | Connects students to teams, recording role, responsibility, and membership status. |
| `MentorAssignment` | Connects faculty to projects and records active status and primary-mentor designation. |
| `Milestone` | Project-level or department-level milestone with due date, status, ordering, and marks weightage. |
| `WeeklyDeliverable` | Weekly requirements and due date, optionally scoped to department, semester, or project. |
| `Task` | Work item linked to a project and optionally to a milestone or weekly deliverable; can be assigned to a user. |
| `Submission` | A project's response to a weekly deliverable, including links, notes, status, revision number, and submitter. |
| `SubmissionFile` | Uploaded file and metadata associated with a submission. |
| `Review` | Reviewer outcome, feedback, marks, and timestamp for a submission. |
| `Assessment` | Assessment definition scoped to department and semester, including type, marks, weightage, and schedule. |
| `AssessmentResult` | Marks and feedback for a project and optionally a student, recorded by an evaluator. |
| `Notification` | Recipient-specific alert with type, read state, and optional related link. |
| `Message` | Message between sender and recipient, optionally associated with a project. |
| `ActivityLog` | Records an action, optional actor/project, timestamp, and metadata. |

### Important relationships

- A project belongs to one department and one semester.
- A project may have one team and multiple mentor assignments.
- A team has student memberships, with a uniqueness constraint on `(team, student)`.
- A project can have milestones and tasks; tasks can optionally refer to a weekly deliverable.
- A submission belongs to a project and weekly deliverable and can have files and reviews.
- An assessment belongs to a department and semester; its results refer to a project and may refer to a student.
- Notifications are addressed to individual users; messages have sender and recipient users.

## 11. Prerequisites

Install the following tools before setup:

- **Python 3.10+** (use a version supported by your Django installation).
- **Node.js and npm** compatible with the Vite version in `frontend/package.json`.
- **PostgreSQL** for the default database configuration, or SQLite if you choose the local-development alternative.
- **Git** (optional, if cloning rather than extracting the ZIP file).

Check the installed versions:

```bash
python --version
node --version
npm --version
```

## 12. Local Installation

Run the backend and frontend in separate terminals.

### Step 1 — Get the project

Clone the repository:

```bash
git clone <repository-url>
cd Omnisync-main
```

Or extract the provided ZIP file and open a terminal in the extracted `Omnisync-main` directory.

### Step 2 — Create a Python virtual environment

```bash
cd backend
python -m venv .venv
```

Activate it.

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows Command Prompt**
```bat
.venv\Scripts\activate.bat
```

**macOS / Linux**
```bash
source .venv/bin/activate
```

### Step 3 — Install backend packages

The repository does not currently contain a pinned backend dependency file. Install the packages used by the application:

```bash
python -m pip install --upgrade pip
pip install Django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv "psycopg[binary]"
```

If your environment reports a missing package when starting Django, install the package corresponding to that import and document it for the team. For repeatable setup, create and maintain a pinned `requirements.txt`.

### Step 4 — Create and configure the database

For PostgreSQL:

1. Install and start PostgreSQL.
2. Create a database, for example `omnisync_db`.
3. Create or select a database user with permission to access that database.
4. Set the connection values in `backend/.env` as described in the next section.

### Step 5 — Apply database migrations

From the `backend/` directory, with the virtual environment activated:

```bash
python manage.py migrate
```

### Step 6 — Create an administrator

```bash
python manage.py createsuperuser
```

Enter the requested email, name, and password. The custom user model uses email as the login identifier. The project configures a superuser's default role as HOD.

### Step 7 — Start Django

```bash
python manage.py runserver
```

The backend should now be available at `http://127.0.0.1:8000/`.

### Step 8 — Install frontend packages

Open another terminal at the repository root:

```bash
cd frontend
npm install
```

### Step 9 — Start the frontend

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Keep both development servers running while using the application.

## 13. Environment Configuration

Create `backend/.env`. This file is loaded by `backend/config/settings.py` and should remain local; never commit real secrets or database passwords.

### PostgreSQL example

```dotenv
SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=omnisync_db
DB_USER=postgres
DB_PASSWORD=replace-with-your-local-database-password
DB_HOST=127.0.0.1
DB_PORT=5432
```

### Optional SQLite configuration

For a local demonstration where PostgreSQL is not available, use:

```dotenv
SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

Then run `python manage.py migrate` from `backend/`.

### Configuration variables

| Variable | Description |
| --- | --- |
| `SECRET_KEY` | Django secret used for cryptographic signing. Use a unique, private value. |
| `DEBUG` | Enables/disables Django debug mode. Keep enabled only for local development. |
| `ALLOWED_HOSTS` | Comma-separated hostnames accepted by Django. |
| `DB_ENGINE` | Django database backend identifier. |
| `DB_NAME` | Database name for PostgreSQL or database file path for SQLite. |
| `DB_USER` | PostgreSQL database username. |
| `DB_PASSWORD` | PostgreSQL password. |
| `DB_HOST` | Database host. |
| `DB_PORT` | Database port. |

**Important:** the checked-in Django settings include development fallback values, including a fallback secret and database password. Explicitly override these values in your local environment and replace the fallback behavior before production deployment.

## 14. Running the Application

### Development URLs

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173/` |
| Backend root | `http://127.0.0.1:8000/` |
| Django Admin | `http://127.0.0.1:8000/admin/` |
| Authentication API | `http://127.0.0.1:8000/api/auth/` |

The frontend Vite configuration proxies:

- `/api` → `http://127.0.0.1:8000`
- `/media` → `http://127.0.0.1:8000`

If the backend is moved to another host or port, update `frontend/vite.config.js` accordingly.

## 15. Demo Data

The repository includes a development data command:

```bash
cd backend
python manage.py seed_data
```

The command creates example department, semester, users, projects, teams, deliverables, submissions, assessments, and related records for demonstration. It uses `get_or_create` for many records, but it should still be treated as a development/demo utility and reviewed before running against an existing database.

**Demo-account safety:** the seed script contains example accounts and a shared sample password (`Password@123`) for accounts it creates. Use seed data only in a local or disposable development database. Never use these sample credentials in a publicly accessible environment. Change or remove seeded credentials before any deployment.

If you prefer an empty database, skip this command and create users and records through the admin interface or the application's supported user-provisioning workflow.

## 16. Frontend Routes

The main routes are defined in `frontend/src/App.jsx`.

| Route | Intended role | Page / purpose |
| --- | --- | --- |
| `/login` | Public | Sign-in page |
| `/student` | Student | Student overview/dashboard |
| `/student/mini-project` | Student | Project and deliverable workspace |
| `/student/weekly-deliverables` | Student | Weekly deliverable workspace |
| `/student/tasks` | Student | Task tracking |
| `/student/gradebook` | Student | Gradebook and assessment results |
| `/student/team` | Student | Team details |
| `/faculty` | Faculty | Faculty overview |
| `/faculty/projects` | Faculty | Assigned project overview |
| `/faculty/teams` | Faculty | Team view |
| `/faculty/submissions` | Faculty | Submission review workspace |
| `/faculty/gradebook` | Faculty | Gradebook view |
| `/hod` | HOD | Department overview |
| `/hod/projects` | HOD | Project management |
| `/hod/approvals` | HOD | Project approval workflow |
| `/hod/deliverables-config` | HOD | Deliverable configuration |
| `/hod/gradebook` | HOD | Gradebook view |
| `/hod/reports` | HOD | Reporting overview |
| `/hod/audit` | HOD | Audit history |
| `/hod/users` | HOD | User management |
| `/inbox` | All authenticated roles | Shared inbox |

Routes are protected by the frontend's `ProtectedRoute` component. Users without a session are redirected to login, and users with an unsupported role are redirected to their role-specific home route.

## 17. REST API Reference

The backend API is mounted under `/api/`. The following table documents the primary resource routes based on the configured URL routers. Django REST Framework routers expose standard list/detail actions, while custom actions are listed separately. Check each app's `urls.py`, views, serializers, and permissions for exact methods, fields, and role restrictions.

### 17.1 Authentication and users

Base path: `/api/auth/`

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/login/` | `POST` | Authenticate and obtain JWT tokens |
| `/api/auth/token/refresh/` | `POST` | Refresh an access token |
| `/api/auth/me/` | `GET` | Retrieve the authenticated user's profile |
| `/api/auth/me/` | `PATCH` | Update supported current-user profile fields |
| `/api/auth/users/` | `GET` | List users permitted by the backend |
| `/api/auth/provision/` | `POST` | Provision a user; restricted to HOD permissions |

### 17.2 Departments and semesters

| Resource | Base endpoint |
| --- | --- |
| Departments | `/api/departments/` |
| Semesters | `/api/semesters/` |

These resources provide the academic and organizational context used by projects, deliverables, and assessments.

### 17.3 Projects, teams, and mentors

| Resource / action | Endpoint |
| --- | --- |
| Projects | `/api/projects/` |
| Approve a project | `/api/projects/{id}/approve/` |
| Reject a project | `/api/projects/{id}/reject/` |
| Assign a mentor | `/api/projects/{id}/assign_mentor/` |
| Teams | `/api/teams/` |
| Add a team member | `/api/teams/{id}/add_member/` |
| Remove a team member | `/api/teams/{id}/remove_member/` |
| Mentor assignments | `/api/mentor-assignments/` |

The approval, rejection, and mentor-assignment actions are implemented as custom project actions. Approval and rejection are restricted to HOD permissions.

### 17.4 Milestones, deliverables, and tasks

| Resource | Base endpoint |
| --- | --- |
| Milestones | `/api/milestones/` |
| Weekly deliverables | `/api/deliverables/` |
| Tasks | `/api/tasks/` |

These endpoints manage project work, due dates, weekly expectations, and task progress.

### 17.5 Submissions and reviews

| Resource | Base endpoint |
| --- | --- |
| Submissions | `/api/submissions/` |

Submission responses can include uploaded files, review records, latest review details, and revision history. Submission access is filtered by user role and project/team relationship.

### 17.6 Assessments and results

| Resource / action | Endpoint |
| --- | --- |
| Assessments | `/api/assessments/` |
| Assessment results | `/api/assessment-results/` |
| Gradebook | `/api/assessments/gradebook/` |

### 17.7 Notifications, messages, and activity logs

| Resource / action | Endpoint |
| --- | --- |
| Notifications | `/api/notifications/` |
| Mark one notification as read | `/api/notifications/{id}/read/` |
| Mark all notifications as read | `/api/notifications/mark_all_read/` |
| Unread notification count | `/api/notifications/unread_count/` |
| Messages | `/api/messages/` |
| Activity logs | `/api/activity-logs/` |

Activity logs are exposed through a read-only viewset.

### 17.8 Reports

| Endpoint | Purpose |
| --- | --- |
| `/api/reports/department/` | Department-level reporting and project health overview |
| `/api/reports/faculty/` | Faculty-focused project and review summary |
| `/api/reports/student-dashboard/` | Student dashboard reporting |
| `/api/reports/export-csv/` | CSV report export |

### API usage notes

- Most API endpoints require authentication because the REST framework default permission is `IsAuthenticated`.
- JWT authentication is configured alongside Django session authentication.
- Page-number pagination is enabled with a default page size of 20.
- Use the serializers and view code as the source of truth for required request fields and response schemas.
- Use the Vite proxy during local development so the frontend can call relative `/api/...` paths.

## 18. Authentication and Access Control

The backend uses a custom `User` model with email as the username field. User roles are `STUDENT`, `FACULTY`, and `HOD`.

JWT settings in the current project configure:
- Access-token lifetime: 120 minutes.
- Refresh-token lifetime: 7 days.

The frontend's authentication context manages the signed-in user and token-related behavior. Protected route groups redirect unauthenticated users to `/login` and route users to the correct role-based area.

**Security distinction:** hiding a page in the frontend is not authorization. Sensitive operations must remain protected by backend permission checks and role-aware querysets. Review these controls whenever adding or changing an endpoint.

## 19. Submission and Review Lifecycle

A submission is associated with a project and weekly deliverable. It may include explanatory notes, repository/demo links, additional links, and uploaded files.

### Submission statuses

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | Work has not begun |
| `DRAFT` | Work is being prepared |
| `SUBMITTED` | Work has been submitted |
| `UNDER_REVIEW` | Work is being reviewed |
| `CHANGES_REQUESTED` | Changes are required |
| `APPROVED` | Work has been approved |
| `REJECTED` | Work has been rejected |
| `LATE` | Submission was recorded after the due date |

### Revision handling

When a new submission is created for the same project and deliverable, the backend calculates a revision number and marks earlier submissions for that project/deliverable as non-current. Submission responses expose revision history so previous attempts can be inspected.

### Review records

A review includes the reviewer, outcome, written feedback, optional marks awarded, maximum marks, and timestamp. Review outcomes are `PENDING`, `APPROVED`, `CHANGES_REQUESTED`, and `REJECTED`.

The backend performs deadline evaluation during submission creation and records late status when the current date is after the deliverable's due date.

## 20. Deadline Checks and Reports

### Deadline command

The notifications app includes a management command to check deadlines. Run it from `backend/`:

```bash
python manage.py check_deadlines
```

Django does not automatically schedule this command. If automatic checks are required, configure a cron job, Task Scheduler, or another job runner to execute it on the desired schedule. Validate the command's behavior in a development database before scheduling it.

### Reporting

The reports app provides department, faculty, and student-dashboard report endpoints, as well as a CSV export endpoint. The HOD dashboard also contains project health information and an intervention queue intended to surface delayed or at-risk projects.

## 21. File Uploads

Submission attachments are stored through Django's media configuration. In development, the project serves media from `/media/` when `DEBUG` is enabled.

The submission implementation defines:
- A maximum upload size of **25 MB per file**.
- An allowlist of file extensions: `pdf`, `docx`, `doc`, `pptx`, `ppt`, `zip`, `tar`, `gz`, and `txt`.
- Stored file metadata including original filename, file type, size, and upload timestamp.

For production, configure private or appropriately protected media storage, validate file contents in addition to extensions, and ensure users cannot access another project's files without authorization.

## 22. Development and Validation

### Backend checks

From `backend/`, with the virtual environment activated:

```bash
python manage.py check
python manage.py test
```

The repository includes Django test modules in the application apps. Run tests after changing models, permissions, API behavior, or business rules.

### Frontend checks

From `frontend/`:

```bash
npm run lint
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

The Vite production build output is generated in `frontend/dist/`.

### Useful development commands

```bash
# Backend: apply schema migrations
python manage.py migrate

# Backend: create an administrator
python manage.py createsuperuser

# Backend: populate demo data (development only)
python manage.py seed_data

# Backend: run deadline checks manually
python manage.py check_deadlines

# Frontend: install packages
npm install

# Frontend: start the dev server
npm run dev
```

## 23. Troubleshooting

### Database connection failure
- Confirm PostgreSQL is running.
- Confirm the database exists and the configured user has access.
- Check `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in `backend/.env`.
- If using SQLite, verify the `DB_ENGINE` and `DB_NAME` values and rerun migrations.

### `ModuleNotFoundError` when starting Django
- Activate the backend virtual environment.
- Install the backend dependencies listed in the setup section.
- Confirm the terminal's current directory is `backend/`.

### Frontend cannot reach the backend
- Start Django at `127.0.0.1:8000`.
- Start Vite at `localhost:5173`.
- Verify the proxy target in `frontend/vite.config.js`.
- Inspect the browser Network panel and Django terminal for the failing request.

### Login fails
- Ensure migrations have been applied.
- Confirm the user exists and is active.
- If using demo data, confirm the seed command completed and that the sample account password has not been changed.
- Inspect the login API response and backend logs.

### Media files do not load
- Confirm the file exists under the configured media root.
- Confirm Django's development media serving is enabled when `DEBUG=True`.
- Check that the frontend proxy includes `/media`.

### Port already in use
- Stop the process already using port `5173` or `8000`, or configure the relevant development server to use a free port.
- If changing the frontend port, ensure the browser uses the new URL.

## 24. Production Readiness and Security

The supplied settings are oriented toward local development. Do not expose the application publicly without a security and deployment review.

Before production deployment:

1. **Secrets:** replace fallback secrets and credentials; load strong secrets from a secure environment or secret manager.
2. **Debug mode:** set `DEBUG=False`.
3. **Hosts:** set `ALLOWED_HOSTS` to explicit trusted hostnames; remove wildcard hosts.
4. **Database:** use a dedicated production database user with least-privilege access.
5. **CORS and CSRF:** configure trusted frontend origins and CSRF settings for the actual deployment architecture.
6. **HTTPS:** configure TLS and appropriate secure cookie, HSTS, and proxy settings.
7. **JWT lifecycle:** review token storage, expiration, refresh, rotation, and revocation requirements.
8. **Authorization:** test every role against every sensitive endpoint, including object-level access.
9. **Uploads:** validate content, protect uploaded files, and consider malware scanning and storage quotas.
10. **Error handling:** avoid exposing stack traces or internal configuration to users.
11. **Operations:** configure database backups, logging, monitoring, and a repeatable deployment process.
12. **Dependencies:** pin and audit Python and npm dependencies; maintain a backend `requirements.txt`.
13. **Demo data:** never expose seeded sample accounts or sample passwords in a live environment.
14. **Testing:** run automated tests and conduct a security review before release.

## 25. Contributing

Contributions and improvements should keep the project's role-based workflows reliable and maintainable.

1. Create a branch for your change.
2. Keep business logic in the appropriate Django app and API calls in the corresponding frontend service module.
3. Add or update tests for new behavior, particularly permissions and project ownership rules.
4. Update this README when adding routes, dependencies, environment variables, or setup steps.
5. Run backend checks and frontend lint/build commands before opening a pull request.
6. Never commit `.env` files, database credentials, access tokens, or private user data.

## 26. License

No `LICENSE` file was present in the supplied repository. Unless a license is added, others should not assume that the project is licensed for redistribution or reuse. Add an appropriate license file if you intend to make the source available under explicit terms.

---

<div align="center">

**OmniSync — Bringing academic project coordination, evaluation, and visibility into one place.**

</div>
