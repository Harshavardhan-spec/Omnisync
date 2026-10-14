from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("departments.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("deliverables.urls")),
    path("api/", include("submissions.urls")),
    path("api/", include("assessments.urls")),
    path("api/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
