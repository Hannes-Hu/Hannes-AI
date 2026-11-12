from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    conversation_id: str | None = None


class Source(BaseModel):
    document_id: str
    filename: str
    page_number: int
    chunk_index: int
    snippet: str
    relevance_score: float = 0.0


class StreamTokenEvent(BaseModel):
    type: Literal["token"] = "token"
    content: str


class StreamSourcesEvent(BaseModel):
    type: Literal["sources"] = "sources"
    sources: list[Source]


class StreamErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    message: str


class StreamDoneEvent(BaseModel):
    type: Literal["done"] = "done"


StreamEvent = StreamTokenEvent | StreamSourcesEvent | StreamErrorEvent | StreamDoneEvent
