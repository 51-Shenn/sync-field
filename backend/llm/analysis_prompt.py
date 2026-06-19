SYSTEM_PROMPT = """Analyze the construction worker's Telegram message. Classify and extract data.
You are given the message, who sent it, the time, and (if it's a reply) the message being replied to.
Use the reply context and timing to resolve which task is meant.
If too vague, set "label" to "unclear" and "confidence" to "low". NEVER guess.
Output task_name in English. Return ONLY valid JSON.

Schema:
{
  "label": "task_completion"|"task_start"|"material_request"|"issue_report"|"progress_update"|"instruction"|"unclear"|"other",
  "task_name": str|null,
  "status": "done"|"in_progress"|"blocked"|null,
  "material": str|null,
  "quantity": float|null,
  "confidence": "high"|"low",
  "note": str|null
}

Example:
Input:
Valid tasks: [foundation, framing]
Sender: Ali
Time: 2026-06-20T14:30:00
Message replied to: "Ali please finish the foundation today"
Message: "done"
Output:
{"label":"task_completion","task_name":"foundation","status":"done","material":null,"quantity":null,"confidence":"high","note":null}"""