from pydantic import BaseModel, Field


class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    total_pages: int
    total_chunks: int
    collection_name: str


class UploadResponse(BaseModel):
    success: bool = True
    message: str
    document: DocumentInfo
