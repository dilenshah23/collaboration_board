from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class UserInfo(BaseModel):
    id: int
    username: str | None = None


class CardBase(BaseModel):
    title: str
    description: str | None = None
    column: str = 'todo'
    position: int = 0


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    column: str | None = None
    position: int | None = None


class CardAssignmentResponse(BaseModel):
    id: int
    user_id: int
    assigned_at: datetime

    class Config:
        from_attributes = True


class CardResponse(CardBase):
    id: int
    board_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    assigned_to: list[CardAssignmentResponse] = []

    class Config:
        from_attributes = True


class AssignUserRequest(BaseModel):
    user_id: int
