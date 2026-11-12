from __future__ import annotations

import hashlib
import io

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from pypdf import PdfReader
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas.upload import DocumentInfo

logger = get_logger(__name__)


def _compute_document_id(filename: str, content: bytes) -> str:
    """Generates a deterministic document hash ensuring idempotency across re-uploads."""
    prefix = content[:4096].hex()
    return hashlib.sha256(f"{filename}:{prefix}".encode()).hexdigest()[:32]


def _extract_pages(content: bytes) -> list[tuple[str, int]]:
    reader = PdfReader(io.BytesIO(content))
    pages: list[tuple[str, int]] = []

    for index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((text, index))

    return pages


def _chunk_text(
    pages: list[tuple[str, int]],
    document_id: str,
    filename: str,
    chunk_size: int,
    chunk_overlap: int,
) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
        is_separator_regex=False,
    )

    chunks: list[Document] = []
    for page_text, page_number in pages:
        splits = splitter.split_text(page_text)
        for chunk_idx_in_page, text in enumerate(splits):
            if not text.strip():
                continue
            chunks.append(
                Document(
                    page_content=text,
                    metadata={
                        "document_id": document_id,
                        "filename": filename,
                        "page_number": page_number,
                        "chunk_index": len(chunks),
                        "chunk_index_in_page": chunk_idx_in_page,
                        "char_count": len(text),
                    },
                )
            )

    return chunks


async def ingest_document(
    *,
    filename: str,
    content: bytes,
    vector_store: QdrantVectorStore,
    settings: Settings,
) -> DocumentInfo:
    document_id = _compute_document_id(filename, content)

    try:
        pages = _extract_pages(content)
    except Exception as exc:
        logger.error("pdf_parse_error", filename=filename, error=str(exc))
        raise ValueError(f"Failed to read PDF payload: {exc}") from exc

    if not pages:
        raise ValueError("Document contains no extractable text. Scanned PDFs are not supported.")

    total_pages = max(page_num for _, page_num in pages)
    chunks = _chunk_text(
        pages=pages,
        document_id=document_id,
        filename=filename,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    # Evict prior chunk revisions for idempotent re-ingestion
    try:
        client: QdrantClient = vector_store.client  # type: ignore[attr-defined]
        client.delete(
            collection_name=settings.qdrant_collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="metadata.document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            ),
        )
    except Exception as exc:
        logger.debug("stale_chunks_cleanup_skipped", error=str(exc))

    try:
        await vector_store.aadd_documents(chunks)
    except Exception as exc:
        logger.error("qdrant_upsert_failed", document_id=document_id, error=str(exc))
        raise RuntimeError(f"Vector store indexing failed: {exc}") from exc

    logger.info(
        "document_ingestion_complete",
        document_id=document_id,
        filename=filename,
        chunks=len(chunks),
    )

    return DocumentInfo(
        document_id=document_id,
        filename=filename,
        total_pages=total_pages,
        total_chunks=len(chunks),
        collection_name=settings.qdrant_collection_name,
    )
