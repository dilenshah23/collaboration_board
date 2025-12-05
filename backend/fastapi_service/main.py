from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import cards, websocket

load_dotenv()

app = FastAPI(title='Collaboration Board - FastAPI Service')

CORS_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:80').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(cards.router, prefix='/api', tags=['cards'])
app.include_router(websocket.router, prefix='/ws', tags=['websocket'])


@app.get('/')
def root() -> dict[str, str]:
    return {'message': 'FastAPI Service for Collaboration Board'}


@app.get('/health')
def health_check() -> dict[str, str]:
    return {'status': 'healthy'}
