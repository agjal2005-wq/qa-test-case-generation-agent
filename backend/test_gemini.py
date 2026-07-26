from dotenv import load_dotenv
from google import genai


load_dotenv()

client = genai.Client()

interaction = client.interactions.create(
    model="gemini-3.6-flash",
    input=(
        "In one short sentence, explain why negative test cases "
        "are important in software testing."
    )
)

print(interaction.output_text)