from __future__ import annotations

from django.urls import path

from .views import BoardDetailView

urlpatterns = [
    path('<int:pk>/', BoardDetailView.as_view(), name='board_detail'),
]
