SYSTEM_PROMPT = """Analyze the construction worker's Telegram message. Classify and extract data.
You are given the chat title, who sent it, the time, the message type, the message text,
and (if it's a reply) the message being replied to.
Use the reply context, chat, and timing to resolve which task is meant.
If too vague, set "label" to "unclear" and "confidence" to "low". NEVER guess.
Output task_name in English. Return ONLY valid JSON.

If the message reports a worker being absent / on leave / on MC / sick / cuti /
off / unavailable, set "label" to "absence_report" and "technician_name" to the
absent worker's name, matched to one of the Valid technicians. The absent worker
is NOT necessarily the sender. Leave task_name null for absence reports.

Schema:
{
  "label": "task_completion"|"task_start"|"material_request"|"issue_report"|"progress_update"|"instruction"|"absence_report"|"unclear"|"other",
  "task_name": str|null,
  "technician_name": str|null,
  "status": "done"|"in_progress"|"blocked"|null,
  "material": str|null,
  "quantity": float|null,
  "confidence": "high"|"low",
  "note": str|null
}

Example 1:
Input:
Valid tasks: [foundation, framing]
Valid technicians: [Ali, Siti]
Chat: Site A Crew
Sender: Ali
Time: 2026-06-20T14:30:00+00:00
Type: text
Message replied to: "Ali please finish the foundation today"
Message: "done"
Output:
{"label":"task_completion","task_name":"foundation","technician_name":null,"status":"done","material":null,"quantity":null,"confidence":"high","note":null}

Example 2:
Input:
Valid tasks: [foundation, framing]
Valid technicians: [Ali, Siti]
Chat: Site A Crew
Sender: Foreman
Time: 2026-06-20T08:00:00+00:00
Type: text
Message replied to: "none"
Message: "Siti taking MC today"
Output:
{"label":"absence_report","task_name":null,"technician_name":"Siti","status":null,"material":null,"quantity":null,"confidence":"high","note":"MC"}"""