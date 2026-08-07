import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_URL = "http://127.0.0.1:8000/knowledge"

SEED_FILE = Path(__file__).with_name(
    "knowledge_seed.json"
)


def send_knowledge_record(record: dict) -> dict:
    request_body = json.dumps(record).encode("utf-8")

    request = Request(
        API_URL,
        data=request_body,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    with urlopen(request) as response:
        response_body = response.read().decode("utf-8")
        return json.loads(response_body)


def seed_knowledge() -> None:
    with SEED_FILE.open(
        "r",
        encoding="utf-8"
    ) as seed_file:
        knowledge_records = json.load(seed_file)

    print(
        f"Loading {len(knowledge_records)} "
        "knowledge records..."
    )

    for record in knowledge_records:
        result = send_knowledge_record(record)

        print(
            f"- {result['source_title']}: "
            f"{result['message']} "
            f"(ID {result['knowledge_id']})"
        )

    print("Knowledge seeding completed.")


if __name__ == "__main__":
    try:
        seed_knowledge()
    except HTTPError as error:
        print(
            "The API rejected a knowledge record:",
            error.read().decode("utf-8")
        )
    except URLError:
        print(
            "Could not connect to FastAPI. "
            "Start the backend before running this script."
        )