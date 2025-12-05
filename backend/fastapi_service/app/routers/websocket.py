from __future__ import annotations

import json
import os
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Card, CardAssignment

router = APIRouter()

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-here')
JWT_ALGORITHM = 'HS256'


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[tuple[WebSocket, dict[str, Any]]]] = {}

    async def connect(self, websocket: WebSocket, board_id: int, user_info: dict[str, Any]):
        await websocket.accept()
        if board_id not in self.active_connections:
            self.active_connections[board_id] = []
        self.active_connections[board_id].append((websocket, user_info))

    def disconnect(self, websocket: WebSocket, board_id: int):
        if board_id in self.active_connections:
            self.active_connections[board_id] = [
                (conn, user) for conn, user in self.active_connections[board_id]
                if conn != websocket
            ]
            if not self.active_connections[board_id]:
                del self.active_connections[board_id]

    async def broadcast(self, board_id: int, message: dict[str, Any], exclude: WebSocket | None = None):
        if board_id not in self.active_connections:
            return

        disconnected = []
        for websocket, _ in self.active_connections[board_id]:
            if exclude and websocket == exclude:
                continue
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket, board_id)


manager = ConnectionManager()


def _validate_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if user_id is None:
            return None
        return {'user_id': user_id, 'username': payload.get('username', 'Unknown')}
    except JWTError:
        return None


def _get_card_data(card: Card, db: Session) -> dict[str, Any]:
    assignments = db.query(CardAssignment).filter(CardAssignment.card_id == card.id).all()
    return {
        'id': card.id,
        'board_id': card.board_id,
        'title': card.title,
        'description': card.description,
        'column': card.column,
        'position': card.position,
        'created_by': card.created_by,
        'created_at': card.created_at.isoformat(),
        'updated_at': card.updated_at.isoformat(),
        'assigned_to': [{'id': a.id, 'user_id': a.user_id} for a in assignments],
    }


@router.websocket('/boards/{board_id}')
async def websocket_endpoint(websocket: WebSocket, board_id: int, token: str = None):
    if not token:
        await websocket.close(code=1008, reason='Missing token')
        return

    user_info = _validate_token(token)
    if not user_info:
        await websocket.close(code=1008, reason='Invalid token')
        return

    await manager.connect(websocket, board_id, user_info)

    db: Session = SessionLocal()
    try:
        cards = db.query(Card).filter(Card.board_id == board_id).all()
        initial_data = {
            'type': 'initial_state',
            'data': [_get_card_data(card, db) for card in cards],
        }
        await websocket.send_json(initial_data)

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            action = message.get('action')
            card_data = message.get('data', {})

            if action == 'card.create':
                card = Card(
                    board_id=board_id,
                    title=card_data.get('title', 'Untitled'),
                    description=card_data.get('description'),
                    column=card_data.get('column', 'todo'),
                    position=card_data.get('position', 0),
                    created_by=user_info['user_id'],
                )
                db.add(card)
                db.commit()
                db.refresh(card)

                response = {
                    'type': 'card.created',
                    'data': _get_card_data(card, db),
                    'user': user_info,
                }
                await manager.broadcast(board_id, response)

            elif action == 'card.update':
                card_id = card_data.get('id')
                if card_id:
                    card = db.query(Card).filter(Card.id == card_id).first()
                    if card:
                        if 'title' in card_data:
                            card.title = card_data['title']
                        if 'description' in card_data:
                            card.description = card_data['description']
                        if 'column' in card_data:
                            card.column = card_data['column']
                        if 'position' in card_data:
                            card.position = card_data['position']

                        db.commit()
                        db.refresh(card)

                        response = {
                            'type': 'card.updated',
                            'data': _get_card_data(card, db),
                            'user': user_info,
                        }
                        await manager.broadcast(board_id, response)

            elif action == 'card.move':
                card_id = card_data.get('id')
                if card_id:
                    card = db.query(Card).filter(Card.id == card_id).first()
                    if card:
                        if 'column' in card_data:
                            card.column = card_data['column']
                        if 'position' in card_data:
                            card.position = card_data['position']

                        db.commit()
                        db.refresh(card)

                        response = {
                            'type': 'card.moved',
                            'data': _get_card_data(card, db),
                            'user': user_info,
                        }
                        await manager.broadcast(board_id, response)

            elif action == 'card.delete':
                card_id = card_data.get('id')
                if card_id:
                    card = db.query(Card).filter(Card.id == card_id).first()
                    if card:
                        db.delete(card)
                        db.commit()

                        response = {
                            'type': 'card.deleted',
                            'data': {'id': card_id, 'board_id': board_id},
                            'user': user_info,
                        }
                        await manager.broadcast(board_id, response)

    except WebSocketDisconnect:
        manager.disconnect(websocket, board_id)
    except Exception as e:
        manager.disconnect(websocket, board_id)
        await websocket.close(code=1011, reason=str(e))
    finally:
        db.close()
