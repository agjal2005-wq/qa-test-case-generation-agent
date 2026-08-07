import math

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()

client = genai.Client()

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768


def create_document_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_DOCUMENT",
            output_dimensionality=EMBEDDING_DIMENSIONS
        )
    )

    return result.embeddings[0].values


def create_query_embedding(text: str) -> list[float]:
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="QUESTION_ANSWERING",
            output_dimensionality=EMBEDDING_DIMENSIONS
        )
    )

    return result.embeddings[0].values


def cosine_similarity(
    first_vector: list[float],
    second_vector: list[float]
) -> float:
    dot_product = sum(
        first_value * second_value
        for first_value, second_value
        in zip(first_vector, second_vector)
    )

    first_length = math.sqrt(
        sum(value * value for value in first_vector)
    )

    second_length = math.sqrt(
        sum(value * value for value in second_vector)
    )

    if first_length == 0 or second_length == 0:
        return 0.0

    return dot_product / (first_length * second_length)