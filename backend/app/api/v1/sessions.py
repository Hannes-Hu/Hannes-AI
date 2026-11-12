from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repository import SessionRepository
from app.schemas.session import MessageResponse, SessionCreate, SessionResponse, SessionWithMessages

router = APIRouter(prefix="/sessions", tags=["Sessions"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(body: SessionCreate, db: DbDep) -> SessionResponse:
    repo = SessionRepository(db)
    session = await repo.create_session(title=body.title)
    return SessionResponse.model_validate(session)


@router.get("", response_model=list[SessionResponse])
async def list_sessions(db: DbDep) -> list[SessionResponse]:
    repo = SessionRepository(db)
    sessions = await repo.list_sessions(limit=50)
    return [SessionResponse.model_validate(s) for s in sessions]


@router.get("/{session_id}", response_model=SessionWithMessages)
async def get_session(session_id: str, db: DbDep) -> SessionWithMessages:
    repo = SessionRepository(db)
    session = await repo.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    messages = [MessageResponse.from_orm_message(m) for m in session.messages]
    return SessionWithMessages(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        messages=messages,
    )
