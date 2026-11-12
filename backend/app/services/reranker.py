from __future__ import annotations

import asyncio
from functools import lru_cache

from langchain_core.documents import Document
from sentence_transformers import CrossEncoder

from app.core.logging import get_logger

logger = get_logger(__name__)
MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@lru_cache(maxsize=1)
def _load_cross_encoder() -> CrossEncoder:
    logger.info("loading_cross_encoder_model", model=MODEL_NAME)
    return CrossEncoder(MODEL_NAME)


async def rerank_documents(
    query: str,
    documents: list[Document],
    top_k: int = 4,
) -> list[Document]:
    if not documents:
        return []

    loop = asyncio.get_running_loop()
    encoder = await loop.run_in_executor(None, _load_cross_encoder)
    pairs = [(query, doc.page_content) for doc in documents]
    scores = await loop.run_in_executor(None, encoder.predict, pairs)

    ranked = sorted(zip(scores, documents), key=lambda x: x[0], reverse=True)
    result: list[Document] = []
    for score, doc in ranked[:top_k]:
        doc.metadata["relevance_score"] = float(score)
        result.append(doc)

    return result
