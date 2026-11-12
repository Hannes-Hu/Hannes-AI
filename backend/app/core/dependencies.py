from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request
from langchain_core.embeddings import Embeddings
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from app.core.config import Settings, get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def build_qdrant_client(settings: Settings) -> QdrantClient:
    return QdrantClient(
        host=settings.qdrant_host,
        port=settings.qdrant_port,
        timeout=10,
    )


def build_embeddings(settings: Settings) -> Embeddings:
    if settings.llm_provider == "ollama":
        try:
            from langchain_ollama import OllamaEmbeddings
            return OllamaEmbeddings(
                base_url=settings.ollama_base_url,
                model=settings.embedding_model,
            )
        except ImportError:
            from langchain_community.embeddings import OllamaEmbeddings
            return OllamaEmbeddings(
                base_url=settings.ollama_base_url,
                model=settings.embedding_model,
            )

    from langchain_openai import OpenAIEmbeddings
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        dimensions=settings.embedding_dimensions,
        openai_api_key=settings.openai_api_key,  # type: ignore[arg-type]
    )


def build_vector_store(
    qdrant_client: QdrantClient,
    embeddings: Embeddings,
    settings: Settings,
) -> QdrantVectorStore:
    existing = {c.name for c in qdrant_client.get_collections().collections}
    needs_creation = settings.qdrant_collection_name not in existing

    if not needs_creation:
        try:
            info = qdrant_client.get_collection(collection_name=settings.qdrant_collection_name)
            params = info.config.params
            current_dim = None

            if hasattr(params, "vectors"):
                vectors_cfg = params.vectors
                if hasattr(vectors_cfg, "size"):
                    current_dim = vectors_cfg.size
                elif isinstance(vectors_cfg, dict) and "" in vectors_cfg:
                    current_dim = getattr(vectors_cfg[""], "size", None)

            if current_dim and current_dim != settings.embedding_dimensions:
                logger.warning(
                    "recreating_qdrant_collection_due_to_dimension_change",
                    previous_dim=current_dim,
                    target_dim=settings.embedding_dimensions,
                )
                qdrant_client.delete_collection(collection_name=settings.qdrant_collection_name)
                needs_creation = True
        except Exception as exc:
            logger.warning("collection_dimension_check_failed", error=str(exc))

    if needs_creation:
        qdrant_client.create_collection(
            collection_name=settings.qdrant_collection_name,
            vectors_config=VectorParams(
                size=settings.embedding_dimensions,
                distance=Distance.COSINE,
            ),
        )

    return QdrantVectorStore(
        client=qdrant_client,
        collection_name=settings.qdrant_collection_name,
        embedding=embeddings,
    )


def build_llm(settings: Settings) -> BaseChatModel:
    if settings.llm_provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
            return ChatOllama(
                base_url=settings.ollama_base_url,
                model=settings.llm_model,
                temperature=0.0,
            )
        except ImportError:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                base_url=settings.ollama_base_url,
                model=settings.llm_model,
                temperature=0.0,
            )

    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=settings.llm_model,
        temperature=0.0,
        streaming=True,
        openai_api_key=settings.openai_api_key,  # type: ignore[arg-type]
    )


def get_qdrant_client(request: Request) -> QdrantClient:
    return request.app.state.qdrant_client  # type: ignore[no-any-return]


def get_embeddings(request: Request) -> Embeddings:
    return request.app.state.embeddings  # type: ignore[no-any-return]


def get_vector_store(request: Request) -> QdrantVectorStore:
    return request.app.state.vector_store  # type: ignore[no-any-return]


def get_llm(request: Request) -> BaseChatModel:
    return request.app.state.llm  # type: ignore[no-any-return]


SettingsDep = Annotated[Settings, Depends(get_settings)]
QdrantClientDep = Annotated[QdrantClient, Depends(get_qdrant_client)]
EmbeddingsDep = Annotated[Embeddings, Depends(get_embeddings)]
VectorStoreDep = Annotated[QdrantVectorStore, Depends(get_vector_store)]
LLMDep = Annotated[BaseChatModel, Depends(get_llm)]
