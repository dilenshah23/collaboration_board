from __future__ import annotations

from django.db import models

from apps.workspaces.models import Workspace


class Board(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='boards')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.name} ({self.workspace.name})'
