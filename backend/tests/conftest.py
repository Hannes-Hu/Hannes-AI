from __future__ import annotations

from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.config import get_settings
from app.main import create_app


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    return Settings(
        llm_provider="ollama",
        ollama_base_url="http://localhost:11434",
        openai_api_key=None,
        llm_model="llama3",
        embedding_model="nomic-embed-text",
        embedding_dimensions=768,
        qdrant_host="localhost",
        qdrant_port=6333,
        qdrant_collection_name="hannesai_test",
        chunk_size=500,
        chunk_overlap=50,
        retriever_k=3,
        bm25_weight=0.4,
        vector_weight=0.6,
        max_upload_size_mb=10,
        allowed_extensions="pdf",
        log_level="WARNING",
    )


@pytest.fixture
def mock_vector_store() -> MagicMock:
    mock = MagicMock()
    mock.aadd_documents = AsyncMock(return_value=["id1", "id2"])
    mock.client = MagicMock()
    mock.client.scroll = MagicMock(return_value=([], None))
    mock.client.delete = MagicMock()
    mock.as_retriever = MagicMock(return_value=MagicMock())
    return mock


@pytest.fixture
def mock_llm() -> MagicMock:
    mock = MagicMock()

    async def fake_astream(input_dict: dict) -> AsyncGenerator[str, None]:
        for token in ["Chunk ", "output."]:
            yield token

    mock.astream = fake_astream
    return mock


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 44 >>\nstream\n"
        b"BT /F1 12 Tf 100 700 Td (Hello HannesAI Test) Tj ET\n"
        b"endstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000266 00000 n \n"
        b"0000000360 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\n"
        b"startxref\n441\n%%EOF"
    )


@pytest.fixture
def test_app(test_settings: Settings, mock_vector_store: MagicMock, mock_llm: MagicMock):
    app = create_app()
    app.state.qdrant_client = mock_vector_store.client
    app.state.embeddings = MagicMock()
    app.state.vector_store = mock_vector_store
    app.state.llm = mock_llm
    app.dependency_overrides[get_settings] = lambda: test_settings
    return app


@pytest.fixture
def client(test_app) -> TestClient:
    return TestClient(test_app, raise_server_exceptions=False)


@pytest_asyncio.fixture
async def async_client(test_app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test",
    ) as ac:
        yield ac
