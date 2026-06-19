import json
import os
from dotenv import load_dotenv
import google.generativeai as genai
from llm.analysis_prompt import SYSTEM_PROMPT
from llm.validators import validate_output

load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-3.1-flash-lite", system_instruction=SYSTEM_PROMPT)

def llm_analyze(text: str, valid_tasks: list[str], ctx: dict) -> dict | None:
    user = f"""Valid tasks: [{', '.join(valid_tasks)}]
Sender: {ctx.get('sender')}
Time: {ctx.get('message_time')}
Message replied to: "{ctx.get('replied_to') or 'none'}"
Message: "{text}\""""

    response = model.generate_content(
        user,
        generation_config={"max_output_tokens": 200}
    )
    raw = response.text.strip().replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return validate_output(data, valid_tasks)