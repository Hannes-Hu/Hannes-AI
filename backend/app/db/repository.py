from __future__ import annotations

import json
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import ChatMessage, ChatSession
from app.schemas.chat import Source


class SessionRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_session(self, title: str | None = None) -> ChatSession:
        session = ChatSession(id=str(uuid.uuid4()), title=title, created_at=datetime.utcnow())
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: str) -> ChatSession | None:
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id)
            .options(selectinload(ChatSession.messages))
        )
        return result.scalars().first()

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sources: list[Source] | None = None,
    ) -> ChatMessage:
        existing_session = await self.get_session(session_id)
        if not existing_session:
            title = content[:40].strip() if role == "user" else None
            existing_session = ChatSession(id=session_id, title=title, created_at=datetime.utcnow())
            self.db.add(existing_session)
            await self.db.flush()
        elif role == "user" and not existing_session.title:
            existing_session.title = content[:40].strip()
            self.db.add(existing_session)

        sources_json: str | None = None
        if sources:
            sources_json = json.dumps([s.model_dump() for s in sources])

        message = ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role=role,
            content=content,
            sources_json=sources_json,
            created_at=datetime.utcnow(),
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_messages(self, session_id: str) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        return list(result.scalars().all())

    async def list_sessions(self, limit: int = 50) -> list[ChatSession]:
        result = await self.db.execute(
            select(ChatSession).order_by(ChatSession.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
