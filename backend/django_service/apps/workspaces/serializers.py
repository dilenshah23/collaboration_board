from __future__ import annotations

from django.contrib.auth.models import User
from rest_framework import serializers

from apps.authentication.serializers import UserSerializer
from .models import Workspace, WorkspaceMember


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ('id', 'user', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = WorkspaceMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'description', 'owner', 'members', 'member_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_member_count(self, obj: Workspace) -> int:
        return obj.members.count()

    def create(self, validated_data: dict) -> Workspace:
        user = self.context['request'].user
        workspace = Workspace.objects.create(owner=user, **validated_data)
        WorkspaceMember.objects.create(workspace=workspace, user=user, role='owner')
        return workspace


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=['admin', 'member'], default='member')

    def validate_user_id(self, value: int) -> int:
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('User does not exist.')
        return value
