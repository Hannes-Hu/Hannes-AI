from __future__ import annotations

from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.documents import Document

from app.core.config import Settings
from app.schemas.chat import StreamDoneEvent, StreamTokenEvent
from app.services.rag import (
    _extract_source_attribution,
    _format_context_documents,
    _format_sse,
    stream_rag_response,
)


class TestFormatDocs:
    def test_format_single_doc(self) -> None:
        docs = [
            Document(
                page_content="Quarterly revenue grew by 18%.",
                metadata={"filename": "report.pdf", "page_number": 3},
            )
        ]
        result = _format_context_documents(docs)
        assert "[Source 1: report.pdf, Page 3]" in result
        assert "Quarterly revenue grew by 18%." in result

    def test_format_multiple_docs_separated(self) -> None:
        docs = [
            Document(page_content="Chunk A", metadata={"filename": "a.pdf", "page_number": 1}),
            Document(page_content="Chunk B", metadata={"filename": "b.pdf", "page_number": 2}),
        ]
        result = _format_context_documents(docs)
        assert "---" in result
        assert "[Source 1:" in result
        assert "[Source 2:" in result

    def test_format_empty_list(self) -> None:
        assert _format_context_documents([]) == ""


class TestBuildSources:
    def test_build_sources_deduplicates(self) -> None:
        docs = [
            Document(
                page_content="Identical content",
                metadata={
                    "document_id": "doc1",
                    "filename": "file.pdf",
                    "page_number": 1,
                    "chunk_index": 0,
                },
            ),
            Document(
                page_content="Identical content",
                metadata={
                    "document_id": "doc1",
                    "filename": "file.pdf",
                    "page_number": 1,
                    "chunk_index": 1,
                },
            ),
        ]
        sources = _extract_source_attribution(docs)
        assert len(sources) == 1

    def test_build_sources_maps_metadata(self) -> None:
        docs = [
            Document(
                page_content="Infrastructure deployment strategy",
                metadata={
                    "document_id": "abc123",
                    "filename": "strategy.pdf",
                    "page_number": 5,
                    "chunk_index": 2,
                    "relevance_score": 0.87,
                },
            )
        ]
        sources = _extract_source_attribution(docs)
        assert len(sources) == 1
        assert sources[0].filename == "strategy.pdf"
        assert sources[0].page_number == 5
        assert sources[0].chunk_index == 2

    def test_build_sources_truncates_snippet(self) -> None:
        long_text = "A" * 500
        docs = [
            Document(
                page_content=long_text,
                metadata={"document_id": "d", "filename": "f.pdf", "page_number": 1, "chunk_index": 0},
            )
        ]
        sources = _extract_source_attribution(docs)
        assert len(sources[0].snippet) <= 300


class TestSSELine:
    def test_sse_line_format(self) -> None:
        event = StreamTokenEvent(content="Hello")
        line = _format_sse(event)
        assert line.startswith("data: ")
        assert line.endswith("\n\n")
        assert '"type":"token"' in line.replace(" ", "")
        assert '"content":"Hello"' in line.replace(" ", "")

    def test_sse_done_event(self) -> None:
        event = StreamDoneEvent()
        line = _format_sse(event)
        assert '"type":"done"' in line.replace(" ", "")


class TestStreamRagResponse:
    @pytest.mark.asyncio
    async def test_stream_emits_tokens_and_sources(self, test_settings: Settings) -> None:
        mock_docs = [
            Document(
                page_content="HannesAI is an enterprise knowledge platform.",
                metadata={
                    "document_id": "doc1",
                    "filename": "intro.pdf",
                    "page_number": 1,
                    "chunk_index": 0,
                },
            )
        ]

        mock_retriever = MagicMock()
        mock_retriever.ainvoke = AsyncMock(return_value=mock_docs)

        mock_llm = MagicMock()
        mock_vector_store = MagicMock()

        with patch("app.services.rag.build_hybrid_retriever", new_callable=AsyncMock, return_value=mock_retriever):
            with patch("app.services.rag.rerank_documents", new_callable=AsyncMock, side_effect=lambda q, docs, top_k: docs):
                with patch("app.services.rag.StrOutputParser"):
                mock_chain = MagicMock()

                async def fake_chain_stream(inp: dict) -> AsyncGenerator[str, None]:
                    for token in ["Enterprise ", "response."]:
                        yield token

                mock_chain.astream = fake_chain_stream

                with patch("app.services.rag.PROMPT_TEMPLATE") as mock_prompt:
                    mock_prompt.__or__ = MagicMock(return_value=mock_chain)
                    mock_chain.__or__ = MagicMock(return_value=mock_chain)

                    events: list[str] = []
                    async for event_line in stream_rag_response(
                        question="What is HannesAI?",
                        vector_store=mock_vector_store,
                        llm=mock_llm,
                        settings=test_settings,
                    ):
                        events.append(event_line)

        all_text = "".join(events)
        assert '"sources"' in all_text
        assert '"done"' in all_text

    @pytest.mark.asyncio
    async def test_stream_no_docs_returns_fallback(self, test_settings: Settings) -> None:
        mock_retriever = MagicMock()
        mock_retriever.ainvoke = AsyncMock(return_value=[])

        with patch("app.services.rag.build_hybrid_retriever", new_callable=AsyncMock, return_value=mock_retriever):
            events: list[str] = []
            async for event_line in stream_rag_response(
                question="Unknown topic",
                vector_store=MagicMock(),
                llm=MagicMock(),
                settings=test_settings,
            ):
                events.append(event_line)

        all_text = "".join(events)
        assert "nicht entnehmen" in all_text or "hochladen" in all_text
        assert '"done"' in all_text
