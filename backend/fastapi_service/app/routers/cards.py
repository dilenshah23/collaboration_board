from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Card, CardAssignment
from app.schemas.card import AssignUserRequest, CardCreate, CardResponse, CardUpdate

router = APIRouter()


@router.get('/boards/{board_id}/cards', response_model=list[CardResponse])
def list_cards(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[Card]:
    cards = db.query(Card).filter(Card.board_id == board_id).all()
    for card in cards:
        card.assigned_to = card.assignments
    return cards


@router.post('/boards/{board_id}/cards', response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    board_id: int,
    card_data: CardCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Card:
    card = Card(
        board_id=board_id,
        title=card_data.title,
        description=card_data.description,
        column=card_data.column,
        position=card_data.position,
        created_by=current_user['user_id'],
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    card.assigned_to = []
    return card


@router.get('/cards/{card_id}', response_model=CardResponse)
def get_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Card:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Card not found')
    card.assigned_to = card.assignments
    return card


@router.patch('/cards/{card_id}', response_model=CardResponse)
def update_card(
    card_id: int,
    card_data: CardUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> Card:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Card not found')

    if card_data.title is not None:
        card.title = card_data.title
    if card_data.description is not None:
        card.description = card_data.description
    if card_data.column is not None:
        card.column = card_data.column
    if card_data.position is not None:
        card.position = card_data.position

    db.commit()
    db.refresh(card)
    card.assigned_to = card.assignments
    return card


@router.delete('/cards/{card_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Card not found')
    db.delete(card)
    db.commit()
    return None


@router.post('/cards/{card_id}/assign', status_code=status.HTTP_201_CREATED)
def assign_user_to_card(
    card_id: int,
    request: AssignUserRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, str]:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Card not found')

    existing = db.query(CardAssignment).filter(
        CardAssignment.card_id == card_id,
        CardAssignment.user_id == request.user_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='User already assigned to this card'
        )

    assignment = CardAssignment(card_id=card_id, user_id=request.user_id)
    db.add(assignment)
    db.commit()

    return {'message': 'User assigned successfully'}


@router.delete('/cards/{card_id}/assign/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def unassign_user_from_card(
    card_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    assignment = db.query(CardAssignment).filter(
        CardAssignment.card_id == card_id,
        CardAssignment.user_id == user_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Assignment not found')

    db.delete(assignment)
    db.commit()
    return None
