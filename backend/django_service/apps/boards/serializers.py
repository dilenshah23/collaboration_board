from __future__ import annotations

from rest_framework import serializers

from apps.workspaces.models import WorkspaceMember
from .models import Board


class BoardSerializer(serializers.ModelSerializer):
    workspace_name = serializers.CharField(source='workspace.name', read_only=True)

    class Meta:
        model = Board
        fields = ('id', 'workspace', 'workspace_name', 'name', 'description', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_workspace(self, value):
        user = self.context['request'].user
        if not WorkspaceMember.objects.filter(workspace=value, user=user).exists():
            raise serializers.ValidationError('You are not a member of this workspace.')
        return value
