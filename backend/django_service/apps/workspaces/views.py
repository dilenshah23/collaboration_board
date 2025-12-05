from __future__ import annotations

from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Workspace, WorkspaceMember
from .permissions import IsWorkspaceMember, IsWorkspaceOwnerOrAdmin
from .serializers import AddMemberSerializer, WorkspaceSerializer


class WorkspaceListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkspaceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Workspace.objects.filter(
            members__user=self.request.user
        ).distinct()


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer
    permission_classes = (IsAuthenticated, IsWorkspaceMember)

    def perform_update(self, serializer):
        if not IsWorkspaceOwnerOrAdmin().has_object_permission(
            self.request, self, serializer.instance
        ):
            return Response(
                {'error': 'Only workspace owner or admin can update workspace'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()

    def perform_destroy(self, instance):
        if not IsWorkspaceOwnerOrAdmin().has_object_permission(
            self.request, self, instance
        ):
            return Response(
                {'error': 'Only workspace owner or admin can delete workspace'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()


class AddWorkspaceMemberView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk) -> Response:
        try:
            workspace = Workspace.objects.get(pk=pk)
        except Workspace.DoesNotExist:
            return Response(
                {'error': 'Workspace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not IsWorkspaceOwnerOrAdmin().has_object_permission(request, self, workspace):
            return Response(
                {'error': 'Only workspace owner or admin can add members'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AddMemberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(id=serializer.validated_data['user_id'])
        role = serializer.validated_data['role']

        if WorkspaceMember.objects.filter(workspace=workspace, user=user).exists():
            return Response(
                {'error': 'User is already a member of this workspace'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member = WorkspaceMember.objects.create(
            workspace=workspace,
            user=user,
            role=role
        )

        return Response(
            {'message': 'Member added successfully', 'member_id': member.id},
            status=status.HTTP_201_CREATED
        )


class RemoveWorkspaceMemberView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk, user_id) -> Response:
        try:
            workspace = Workspace.objects.get(pk=pk)
        except Workspace.DoesNotExist:
            return Response(
                {'error': 'Workspace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not IsWorkspaceOwnerOrAdmin().has_object_permission(request, self, workspace):
            return Response(
                {'error': 'Only workspace owner or admin can remove members'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            member = WorkspaceMember.objects.get(workspace=workspace, user_id=user_id)
            if member.role == 'owner':
                return Response(
                    {'error': 'Cannot remove workspace owner'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            member.delete()
            return Response(
                {'message': 'Member removed successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
