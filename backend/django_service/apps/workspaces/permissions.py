from __future__ import annotations

from rest_framework import permissions

from .models import WorkspaceMember


class IsWorkspaceMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return WorkspaceMember.objects.filter(
            workspace=obj,
            user=request.user
        ).exists()


class IsWorkspaceOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return WorkspaceMember.objects.filter(
            workspace=obj,
            user=request.user,
            role__in=['owner', 'admin']
        ).exists()
