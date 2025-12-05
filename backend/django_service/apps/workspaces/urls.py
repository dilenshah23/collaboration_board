from __future__ import annotations

from django.urls import path

from apps.boards.views import BoardCreateView, BoardListView
from .views import (
    AddWorkspaceMemberView,
    RemoveWorkspaceMemberView,
    WorkspaceDetailView,
    WorkspaceListCreateView,
)

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace_list_create'),
    path('<int:pk>/', WorkspaceDetailView.as_view(), name='workspace_detail'),
    path('<int:pk>/members/', AddWorkspaceMemberView.as_view(), name='workspace_add_member'),
    path('<int:pk>/members/<int:user_id>/', RemoveWorkspaceMemberView.as_view(), name='workspace_remove_member'),
    path('<int:workspace_id>/boards/', BoardListView.as_view(), name='board_list'),
    path('<int:workspace_id>/boards/create/', BoardCreateView.as_view(), name='board_create'),
]
