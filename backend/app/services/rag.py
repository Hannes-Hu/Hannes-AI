from __future__ import annotations

from collections.abc import AsyncGenerator

from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_qdrant import QdrantVectorStore
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.logging import get_logger
from app.db.repository import SessionRepository
from app.schemas.chat import (
    Source,
    StreamDoneEvent,
    StreamErrorEvent,
    StreamSourcesEvent,
    StreamTokenEvent,
)
from app.services.reranker import rerank_documents

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are Hannes, an enterprise-grade document intelligence assistant.

Operational constraints:
1. Ground answers strictly and exclusively in the provided context documents.
2. If the context does not contain sufficient information, state clearly:
   "Das kann ich den bereitgestellten Dokumenten nicht entnehmen."
3. Never extrapolate beyond facts stated in the context.
4. Maintain concise, structured markdown formatting (lists, bold key terms, tables if appropriate).
5. Respond in the language used in the user's inquiry (defaulting to German when addressed in German).

{history_block}Context:
{context}
"""

PROMPT_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", "{question}"),
    ]
)


def _format_context_documents(docs: list[Document]) -> str:
    sections: list[str] = []
    for index, doc in enumerate(docs, start=1):
        meta = doc.metadata
        filename = meta.get("filename", "unknown")
        page = meta.get("page_number", "?")
        sections.append(f"[Source {index}: {filename}, Page {page}]\n{doc.page_content}")
    return "\n\n---\n\n".join(sections)


def _extract_source_attribution(docs: list[Document]) -> list[Source]:
    seen: set[str] = set()
    sources: list[Source] = []

    for doc in docs:
        meta = doc.metadata
        snippet = doc.page_content[:300].strip()

        if snippet in seen:
            continue
        seen.add(snippet)

        sources.append(
            Source(
                document_id=meta.get("document_id", "unknown"),
                filename=meta.get("filename", "unknown"),
                page_number=int(meta.get("page_number", 0)),
                chunk_index=int(meta.get("chunk_index", 0)),
                snippet=snippet,
                relevance_score=float(meta.get("relevance_score", 0.0)),
            )
        )

    return sources


async def _fetch_collection_corpus(
    vector_store: QdrantVectorStore,
    settings: Settings,
) -> list[Document]:
    client = vector_store.client  # type: ignore[attr-defined]
    documents: list[Document] = []
    offset = None
    batch_size = 100

    while True:
        points, next_offset = client.scroll(
            collection_name=settings.qdrant_collection_name,
            limit=batch_size,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        for point in points:
            payload = point.payload or {}
            content = payload.get("page_content", "")
            if content:
                documents.append(
                    Document(
                        page_content=content,
                        metadata=payload.get("metadata", {}),
                    )
                )

        if next_offset is None:
            break
        offset = next_offset

    return documents


async def build_hybrid_retriever(
    *,
    vector_store: QdrantVectorStore,
    settings: Settings,
) -> EnsembleRetriever:
    vector_retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": settings.retriever_k},
    )

    corpus = await _fetch_collection_corpus(vector_store, settings)
    if not corpus:
        return EnsembleRetriever(
            retrievers=[vector_retriever],
            weights=[1.0],
        )

    bm25_retriever = BM25Retriever.from_documents(corpus, k=settings.retriever_k)
    return EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[settings.vector_weight, settings.bm25_weight],
    )


async def _build_history_block(session_id: str, db: AsyncSession) -> str:
    repo = SessionRepository(db)
    messages = await repo.get_messages(session_id)
    recent = messages[-6:] if len(messages) > 6 else messages
    if not recent:
        return ""

    lines: list[str] = ["Previous conversation (for context only — do not cite):\n"]
    for msg in recent:
        prefix = "User" if msg.role == "user" else "Assistant"
        lines.append(f"{prefix}: {msg.content}")
    lines.append("")
    return "\n".join(lines) + "\n"


async def stream_rag_response(
    *,
    question: str,
    vector_store: QdrantVectorStore,
    llm: BaseChatModel,
    settings: Settings,
    session_id: str | None = None,
) -> AsyncGenerator[str, None]:
    history_block = ""
    if session_id:
        try:
            from app.db.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                history_block = await _build_history_block(session_id, session)
        except Exception as exc:
            logger.error("failed_to_build_history_block", error=str(exc), session_id=session_id)

    try:
        retriever = await build_hybrid_retriever(
            vector_store=vector_store,
            settings=settings,
        )
        retrieved_docs: list[Document] = await retriever.ainvoke(question)
    except Exception as exc:
        logger.error("retrieval_pipeline_failed", error=str(exc))
        yield _format_sse(StreamErrorEvent(message=f"Retrieval failed: {exc}"))
        return

    retrieved_docs = await rerank_documents(question, retrieved_docs, top_k=settings.reranker_top_k)

    if not retrieved_docs:
        fallback_msg = (
            "Das kann ich den bereitgestellten Dokumenten nicht entnehmen. "
            "Bitte lade zuerst relevante Dokumente hoch."
        )
        yield _format_sse(StreamTokenEvent(content=fallback_msg))
        yield _format_sse(StreamSourcesEvent(sources=[]))
        yield _format_sse(StreamDoneEvent())

        if session_id:
            try:
                from app.db.database import AsyncSessionLocal
                async with AsyncSessionLocal() as session:
                    repo = SessionRepository(session)
                    await repo.add_message(session_id, role="user", content=question)
                    await repo.add_message(session_id, role="assistant", content=fallback_msg, sources=[])
                    logger.info("persisted_fallback_chat_exchange", session_id=session_id)
            except Exception as exc:
                logger.error("failed_to_persist_fallback_message", error=str(exc), session_id=session_id)
        return

    context = _format_context_documents(retrieved_docs)
    chain = (
        RunnablePassthrough.assign(
            context=lambda _: context,
            history_block=lambda _: history_block,
        )
        | PROMPT_TEMPLATE
        | llm
        | StrOutputParser()
    )

    full_response: list[str] = []
    try:
        async for token in chain.astream({"question": question}):
            if token:
                full_response.append(token)
                yield _format_sse(StreamTokenEvent(content=token))
    except Exception as exc:
        logger.error("generation_stream_interrupted", error=str(exc))
        yield _format_sse(StreamErrorEvent(message=f"Model generation error: {exc}"))
        return

    sources = _extract_source_attribution(retrieved_docs)
    yield _format_sse(StreamSourcesEvent(sources=sources))
    yield _format_sse(StreamDoneEvent())

    if session_id:
        try:
            from app.db.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                repo = SessionRepository(session)
                await repo.add_message(session_id, role="user", content=question)
                await repo.add_message(
                    session_id,
                    role="assistant",
                    content="".join(full_response),
                    sources=sources,
                )
                logger.info("persisted_chat_exchange", session_id=session_id)
        except Exception as exc:
            logger.error("failed_to_persist_chat_message", error=str(exc), session_id=session_id)


def _format_sse(event: StreamTokenEvent | StreamSourcesEvent | StreamErrorEvent | StreamDoneEvent) -> str:
    return f"data: {event.model_dump_json()}\n\n"
