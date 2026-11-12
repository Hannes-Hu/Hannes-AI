from functools import lru_cache
from typing import Annotated, Literal

from fastapi import Depends
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    llm_provider: Literal["ollama", "openai"] = Field(
        default="ollama",
        description="Active LLM and embedding provider.",
    )

    ollama_base_url: str = Field(
        default="http://localhost:11434",
        description="Ollama REST API endpoint.",
    )

    openai_api_key: str | None = Field(
        default=None,
        description="OpenAI API key. Required when llm_provider is 'openai'.",
    )

    llm_model: str = Field(
        default="llama3",
        description="Chat completion model identifier.",
    )
    embedding_model: str = Field(
        default="nomic-embed-text",
        description="Dense embedding model identifier.",
    )
    embedding_dimensions: int = Field(
        default=768,
        description="Vector dimensionality matching the embedding model.",
    )

    qdrant_host: str = Field(default="localhost")
    qdrant_port: int = Field(default=6333)
    qdrant_collection_name: str = Field(default="hannes_chunks")

    chunk_size: int = Field(default=1000)
    chunk_overlap: int = Field(default=200)
    retriever_k: int = Field(default=6)
    bm25_weight: float = Field(default=0.4)
    vector_weight: float = Field(default=0.6)

    max_upload_size_mb: int = Field(default=50)
    allowed_extensions: str = Field(default="pdf")

    reranker_model: str = Field(default="cross-encoder/ms-marco-MiniLM-L-6-v2")
    reranker_top_k: int = Field(default=4)

    backend_host: str = Field(default="0.0.0.0")
    backend_port: int = Field(default=8000)
    log_level: str = Field(default="INFO")

    @field_validator("bm25_weight", "vector_weight")
    @classmethod
    def validate_retrieval_weights(cls, value: float) -> float:
        if not 0.0 <= value <= 1.0:
            raise ValueError("Retriever weights must be bounded within [0.0, 1.0].")
        return value

    @model_validator(mode="after")
    def validate_credentials(self) -> "Settings":
        if self.llm_provider == "openai" and not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY must be provided when LLM_PROVIDER is 'openai'.")
        return self

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]

    @property
    def qdrant_url(self) -> str:
        return f"http://{self.qdrant_host}:{self.qdrant_port}"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


SettingsDep = Annotated[Settings, Depends(get_settings)]
