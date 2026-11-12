from __future__ import annotations

import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.chat import Source


class SessionCreate(BaseModel):
    title: str | None = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str | None
    created_at: datetime


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    role: str
    content: str
    sources: list[Source]
    created_at: datetime

    @classmethod
    def from_orm_message(cls, msg: object) -> MessageResponse:
        """Deserialise sources_json back to Source objects before validation."""
        raw_sources: list[Source] = []
        sources_json = getattr(msg, "sources_json", None)
        if sources_json:
            raw_sources = [Source(**s) for s in json.loads(sources_json)]
        return cls(
            id=getattr(msg, "id"),
            session_id=getattr(msg, "session_id"),
            role=getattr(msg, "role"),
            content=getattr(msg, "content"),
            sources=raw_sources,
            created_at=getattr(msg, "created_at"),
        )


class SessionWithMessages(SessionResponse):
    messages: list[MessageResponse]
