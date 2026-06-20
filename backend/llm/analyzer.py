import json
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from llm.analysis_prompt import SYSTEM_PROMPT
from llm.validators import validate_output

load_dotenv()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def llm_analyze(message: dict, valid_tasks: list[str]) -> dict | None:
    user = f"""Valid tasks: [{', '.join(valid_tasks)}]
Chat: {message.get('chat_title')}
Sender: {message.get('sender_name')}
Time: {message.get('sent_at')}
Type: {message.get('type')}
Message replied to: "{message.get('replied_to') or 'none'}"
Message: "{message.get('text')}\""""

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=200,
        ),
    )
    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return validate_output(data, valid_tasks)