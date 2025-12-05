from __future__ import annotations

from rest_framework import permissions

from apps.workspaces.models import WorkspaceMember


class IsBoardWorkspaceMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return WorkspaceMember.objects.filter(
            workspace=obj.workspace,
            user=request.user
        ).exists()
