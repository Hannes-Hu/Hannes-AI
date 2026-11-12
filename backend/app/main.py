from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import chat, sessions, upload
from app.core.config import get_settings
from app.core.dependencies import (
    build_embeddings,
    build_llm,
    build_qdrant_client,
    build_vector_store,
)
from app.core.logging import configure_logging, get_logger
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging()
    logger = get_logger("lifespan")
    settings = get_settings()

    logger.info("application_startup", provider=settings.llm_provider, model=settings.llm_model)

    await init_db()

    qdrant_client = build_qdrant_client(settings)
    embeddings = build_embeddings(settings)
    vector_store = build_vector_store(qdrant_client, embeddings, settings)
    llm = build_llm(settings)

    app.state.qdrant_client = qdrant_client
    app.state.embeddings = embeddings
    app.state.vector_store = vector_store
    app.state.llm = llm

    yield

    logger.info("application_shutdown")
    qdrant_client.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Hannes AI",
        description="Production hybrid RAG platform with dense vector retrieval, sparse keyword search, cross-encoder re-ranking, and streaming source attribution.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type"],
    )

    app.include_router(upload.router, prefix="/api/v1")
    app.include_router(chat.router, prefix="/api/v1")
    app.include_router(sessions.router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, str]:
        return {"status": "healthy", "service": "hannes-backend"}

    return app


app = create_app()
