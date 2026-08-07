from dotenv import load_dotenv

from rag import (
    cosine_similarity,
    create_document_embedding,
    create_query_embedding
)


load_dotenv()

documents = [
    {
        "title": "Admission policy",
        "content": (
            "Applicants must submit the online admission form, "
            "academic documents, and the applicable admission fee."
        )
    },
    {
        "title": "Library policy",
        "content": (
            "Students may borrow four books from the university "
            "library for a maximum period of fourteen days."
        )
    },
    {
        "title": "Examination policy",
        "content": (
            "Students must carry their admit card and university "
            "identity card to the examination hall."
        )
    }
]

question = "What must a student provide when applying to the university?"

question_embedding = create_query_embedding(question)

scored_documents = []

for document in documents:
    document_embedding = create_document_embedding(
        document["content"]
    )

    score = cosine_similarity(
        question_embedding,
        document_embedding
    )

    scored_documents.append({
        "title": document["title"],
        "score": score
    })

scored_documents.sort(
    key=lambda document: document["score"],
    reverse=True
)

print("Question:", question)
print("\nDocuments ranked by relevance:")

for document in scored_documents:
    print(
        document["title"],
        "-",
        round(document["score"], 4)
    )

print(
    "\nMost relevant document:",
    scored_documents[0]["title"]
)