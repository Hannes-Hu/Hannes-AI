from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.config import SettingsDep
from app.core.dependencies import LLMDep, VectorStoreDep
from app.core.logging import get_logger
from app.schemas.chat import ChatRequest
from app.services.rag import stream_rag_response

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "",
    summary="Execute RAG query with Server-Sent Events streaming",
    responses={
        200: {
            "description": "Event stream emitting token, sources, and done events.",
            "content": {"text/event-stream": {}},
        },
    },
)
async def chat(
    request: ChatRequest,
    settings: SettingsDep,
    vector_store: VectorStoreDep,
    llm: LLMDep,
) -> StreamingResponse:
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for event in stream_rag_response(
                question=request.question,
                vector_store=vector_store,
                llm=llm,
                settings=settings,
            ):
                yield event
        except Exception as exc:
            logger.error("chat_stream_unhandled_error", error=str(exc))
            yield 'data: {"type": "error", "message": "Internal streaming failure"}\n\n'

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
