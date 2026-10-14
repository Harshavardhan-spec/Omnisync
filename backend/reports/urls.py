from django.urls import path
from .views import DepartmentReportView, FacultyReportView, StudentDashboardReportView, ExportCSVReportView

urlpatterns = [
    path("department/", DepartmentReportView.as_view(), name="report-department"),
    path("faculty/", FacultyReportView.as_view(), name="report-faculty"),
    path("student-dashboard/", StudentDashboardReportView.as_view(), name="report-student-dashboard"),
    path("export-csv/", ExportCSVReportView.as_view(), name="report-export-csv"),
]
