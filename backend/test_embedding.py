from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()

client = genai.Client()

text = """
A university applicant must submit the online application form,
required academic documents, and the applicable admission fee.
"""

result = client.models.embed_content(
    model="gemini-embedding-001",
    contents=text,
    config=types.EmbedContentConfig(
        task_type="RETRIEVAL_DOCUMENT",
        output_dimensionality=768
    )
)

embedding = result.embeddings[0].values

print("Embedding created successfully")
print("Number of dimensions:", len(embedding))
print("First five values:", embedding[:5])