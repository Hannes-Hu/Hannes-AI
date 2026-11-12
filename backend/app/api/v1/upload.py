from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, status

from app.core.config import SettingsDep
from app.core.dependencies import VectorStoreDep
from app.core.logging import get_logger
from app.schemas.upload import UploadResponse
from app.services.ingestion import ingest_document

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_MIME_TYPES = {"application/pdf", "application/octet-stream"}


@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest PDF document",
)
async def upload_document(
    file: UploadFile,
    settings: SettingsDep,
    vector_store: VectorStoreDep,
) -> UploadResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '.{extension}'. Allowed: {', '.join(settings.allowed_extensions_list)}",
        )

    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Invalid MIME type: {file.content_type}. Expected: application/pdf",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file payload is empty.",
        )

    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Payload exceeds limit: {len(content) / (1024 * 1024):.1f} MB (maximum: {settings.max_upload_size_mb} MB).",
        )

    try:
        document_info = await ingest_document(
            filename=file.filename,
            content=content,
            vector_store=vector_store,
            settings=settings,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return UploadResponse(
        success=True,
        message=f"'{file.filename}' successfully indexed ({document_info.total_chunks} chunks, {document_info.total_pages} pages).",
        document=document_info,
    )
