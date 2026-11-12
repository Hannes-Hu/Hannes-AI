from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from unittest.mock import patch

from fastapi.testclient import TestClient


class TestChatEndpoint:
    def test_chat_returns_event_stream_content_type(self, client: TestClient) -> None:
        async def fake_stream(*args, **kwargs) -> AsyncGenerator[str, None]:
            yield 'data: {"type": "token", "content": "Response chunk"}\n\n'
            yield 'data: {"type": "done"}\n\n'

        with patch("app.api.v1.chat.stream_rag_response", side_effect=fake_stream):
            response = client.post(
                "/api/v1/chat",
                json={"question": "Summarize key findings"},
                headers={"Accept": "text/event-stream"},
            )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

    def test_chat_empty_question_rejected(self, client: TestClient) -> None:
        response = client.post("/api/v1/chat", json={"question": ""})
        assert response.status_code == 422

    def test_chat_missing_question_rejected(self, client: TestClient) -> None:
        response = client.post("/api/v1/chat", json={})
        assert response.status_code == 422

    def test_chat_stream_payload_structure(self, client: TestClient) -> None:
        source_data = {
            "document_id": "doc_123",
            "filename": "report.pdf",
            "page_number": 2,
            "chunk_index": 1,
            "snippet": "Excerpt",
            "relevance_score": 0.92,
        }

        async def fake_stream(*args, **kwargs) -> AsyncGenerator[str, None]:
            yield 'data: {"type": "token", "content": "Sample"}\n\n'
            yield f'data: {{"type": "sources", "sources": [{json.dumps(source_data)}]}}\n\n'
            yield 'data: {"type": "done"}\n\n'

        with patch("app.api.v1.chat.stream_rag_response", side_effect=fake_stream):
            response = client.post(
                "/api/v1/chat",
                json={"question": "Query"},
            )

        lines = [line for line in response.text.strip().split("\n") if line.startswith("data: ")]
        assert len(lines) == 3

        parsed_events = [json.loads(line[6:]) for line in lines]
        assert parsed_events[0]["type"] == "token"
        assert parsed_events[1]["type"] == "sources"
        assert parsed_events[1]["sources"][0]["filename"] == "report.pdf"
        assert parsed_events[2]["type"] == "done"

    def test_health_endpoint(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
