from __future__ import annotations

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/workspaces/', include('apps.workspaces.urls')),
    path('api/boards/', include('apps.boards.urls')),
]
