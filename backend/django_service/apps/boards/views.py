from __future__ import annotations

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.workspaces.models import Workspace, WorkspaceMember
from .models import Board
from .permissions import IsBoardWorkspaceMember
from .serializers import BoardSerializer


class BoardListView(generics.ListAPIView):
    serializer_class = BoardSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        workspace_id = self.kwargs.get('workspace_id')
        try:
            workspace = Workspace.objects.get(pk=workspace_id)
        except Workspace.DoesNotExist:
            return Board.objects.none()

        if not WorkspaceMember.objects.filter(workspace=workspace, user=self.request.user).exists():
            return Board.objects.none()

        return Board.objects.filter(workspace=workspace)


class BoardCreateView(generics.CreateAPIView):
    serializer_class = BoardSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        workspace_id = self.kwargs.get('workspace_id')
        try:
            workspace = Workspace.objects.get(pk=workspace_id)
        except Workspace.DoesNotExist:
            return Response(
                {'error': 'Workspace not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not WorkspaceMember.objects.filter(workspace=workspace, user=request.user).exists():
            return Response(
                {'error': 'You are not a member of this workspace'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data={**request.data, 'workspace': workspace_id})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BoardDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    permission_classes = (IsAuthenticated, IsBoardWorkspaceMember)
