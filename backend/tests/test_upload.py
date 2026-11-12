from __future__ import annotations

import io
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.schemas.upload import DocumentInfo


class TestUploadEndpoint:
    def test_upload_valid_pdf_returns_201(
        self,
        client: TestClient,
        sample_pdf_bytes: bytes,
    ) -> None:
        mock_doc_info = DocumentInfo(
            document_id="abc123def456abc123def456abc12345",
            filename="test.pdf",
            total_pages=1,
            total_chunks=3,
            collection_name="hannes_test",
        )

        with patch(
            "app.api.v1.upload.ingest_document",
            new_callable=AsyncMock,
            return_value=mock_doc_info,
        ):
            response = client.post(
                "/api/v1/upload",
                files={"file": ("test.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")},
            )

        assert response.status_code == 201
        body = response.json()
        assert body["success"] is True
        assert body["document"]["filename"] == "test.pdf"
        assert body["document"]["total_chunks"] == 3

    def test_upload_unsupported_extension_returns_415(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/upload",
            files={"file": ("document.docx", io.BytesIO(b"binary data"), "application/octet-stream")},
        )
        assert response.status_code == 415

    def test_upload_empty_payload_returns_400(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/upload",
            files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
        )
        assert response.status_code == 400

    def test_upload_oversized_payload_returns_413(self, client: TestClient) -> None:
        oversized = b"0" * (11 * 1024 * 1024)
        response = client.post(
            "/api/v1/upload",
            files={"file": ("oversized.pdf", io.BytesIO(oversized), "application/pdf")},
        )
        assert response.status_code == 413

    def test_upload_unextractable_pdf_returns_422(self, client: TestClient) -> None:
        with patch(
            "app.api.v1.upload.ingest_document",
            new_callable=AsyncMock,
            side_effect=ValueError("No extractable text found"),
        ):
            response = client.post(
                "/api/v1/upload",
                files={"file": ("scanned.pdf", io.BytesIO(b"%PDF-1.4 dummy"), "application/pdf")},
            )

        assert response.status_code == 422

    def test_upload_service_unavailable_returns_503(
        self,
        client: TestClient,
        sample_pdf_bytes: bytes,
    ) -> None:
        with patch(
            "app.api.v1.upload.ingest_document",
            new_callable=AsyncMock,
            side_effect=RuntimeError("Vector database unreachable"),
        ):
            response = client.post(
                "/api/v1/upload",
                files={"file": ("test.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")},
            )

        assert response.status_code == 503
