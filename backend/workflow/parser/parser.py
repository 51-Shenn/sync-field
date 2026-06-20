import json
import re
from dataclasses import dataclass, field
from typing import Union

from backend.db.resolution_cache import cache_key, ResolutionCache


FAILURE_KEYWORD_MAP = {
    "RESOURCE": {
        "MATERIAL_MISSING": [
            r"\bmissing\s+material\b", r"\bno\s+material\b", r"\bout\s+of\s+material\b",
            r"\bshort\s+of\b", r"\bnot\s+enough\b", r"\binsufficient\s+material\b",
            r"\blari\s+material\b", r"\bout\s+of\s+stock\b",
            r"\btak\s+cukup\b", r"\bx\s+cukup\b", r"\bhabis\b",
            r"\bstok\s+kosong\b", r"\bkosong\b",
        ],
        "TOOL_DAMAGED": [
            r"\btool\s+(broken|damaged|rosak)\b", r"\bdrill\s+(broken|not\s+working)\b",
            r"\bequipment\s+(failure|rosak)\b",
            r"\bpatah\b", r"\brosak\b", r"\btak\s+boleh\s+pakai\b",
        ],
        "TOOL_MISSING": [
            r"\btool\s+(missing|not\s+found)\b", r"\bdont\s+have\b.*\btool\b",
            r"\bforgot\b.*\btool\b", r"\bkoyak\b",
        ],
    },
    "SITE": {
        "SITE_NOT_READY": [
            r"\bsite\s+not\s+ready\b", r"\bsite\s+locked\b", r"\bnot\s+ready\b.*\bsite\b",
            r"\btempat\s+belum\s+siap\b",
        ],
        "NO_POWER": [
            r"\bno\s+power\b", r"\bpower\s+outage\b", r"\btiada\s+letrik\b",
            r"\belectricity\s+cut\b", r"\bblackout\b",
            r"\bpower\b.*\btak\s+ready\b",
        ],
        "ACCESS_DENIED": [
            r"\baccess\s+denied\b", r"\bcannot\s+access\b", r"\bsite\s+closed\b",
            r"\btidak\s+dapat\s+akses\b", r"\bsecurity\s+(block|dont\s+let)\b",
        ],
    },
    "TECHNICAL": {
        "CONFIG_CONFLICT": [
            r"\bconfig\s+(conflict|clash|issue)\b", r"\bconfiguration\s+(error|broken)\b",
            r"\bsetting\s+(conflict|wrong)\b",
        ],
        "TEST_FAILED": [
            r"\btest\s+(fail|failing|not\s+pass)\b", r"\bchecks?\s+fail\b",
            r"\bverification\s+fail\b", r"\bping\s+fail\b",
            r"\bblank\b", r"\bno\s+pulse\b", r"\bpin\b.*\bfail\b",
        ],
        "IP_CONFLICT": [
            r"\bip\s+conflict\b", r"\bduplicate\s+ip\b", r"\bip\s+clash\b",
            r"\baddress\s+already\s+in\s+use\b", r"\bconflict\b.*\bip\b",
            r"\btakleh\s+login\b", r"\btak\s+boleh\s+login\b", r"\bip\s+crash\b",
        ],
    },
    "QUALITY": {
        "BLUR": [
            r"\bblur(ry)?\b", r"\bfocus\s+issue\b", r"\bnot\s+clear\b",
            r"\bimage\s+(blur|out\s+of\s+focus)\b",
        ],
        "WRONG_ANGLE": [
            r"\bwrong\s+angle\b", r"\bbad\s+angle\b", r"\bangle\s+(off|issue)\b",
        ],
        "DEFECTIVE_UNIT": [
            r"\bdefective\b", r"\bDOA\b", r"\bdead\s+on\s+arrival\b",
            r"\brosak\b", r"\bunit\s+(broken|not\s+working)\b",
        ],
    },
}


@dataclass
class ParseResult:
    task_id: str
    failure_type: str
    technician_id: str
    tier: int
    cached: bool = False
    raw_input: str = ""
    extra: dict = field(default_factory=dict)


class FieldOpsParser:
    def __init__(self, resolution_cache: Union[ResolutionCache, None] = None):
        self.cache = resolution_cache

    def parse(self, text: str, technician_id: str = "", active_task_id: str = "") -> ParseResult:
        raw = text.strip()

        result = self._tier1_json(raw, technician_id)
        if result:
            return result

        result = self._tier1_command(raw, technician_id)
        if result:
            return result

        result = self._tier2_keyword(raw, technician_id, active_task_id)
        if result:
            return result

        return self._tier3_llm(raw, technician_id)

    def _tier1_json(self, text: str, tech_id: str) -> Union[ParseResult, None]:
        if not text.startswith("{"):
            return None
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return None

        task_id = data.get("task_id") or data.get("task")
        failure_type = data.get("failure_type") or data.get("failure") or data.get("type")
        technician = data.get("technician_id") or data.get("tech") or tech_id

        if not task_id or not failure_type:
            return None
        if not technician:
            return None

        return ParseResult(
            task_id=task_id.upper(),
            failure_type=self._normalize_failure_type(failure_type),
            technician_id=technician,
            tier=1,
            raw_input=text,
            extra=data,
        )

    def _tier1_command(self, text: str, tech_id: str) -> Union[ParseResult, None]:
        all_failures = set()
        for failures in FAILURE_KEYWORD_MAP.values():
            all_failures.update(failures.keys())
        failure_alt = "|".join(all_failures)

        pattern = re.compile(
            rf"(?:report\s+)?(?P<task_id>[TS]\d{{2,}})\s+"
            rf"(?P<failure>{failure_alt})"
            rf"(?:\s+(?:by|from|tech|technician)\s+(?P<tech>\w+))?",
            re.IGNORECASE,
        )
        match = pattern.match(text)
        if not match:
            return None

        task_id = match.group("task_id").upper()
        failure_type = self._normalize_failure_type(match.group("failure"))
        technician = match.group("tech") or tech_id
        if not technician:
            return None

        return ParseResult(
            task_id=task_id,
            failure_type=failure_type,
            technician_id=technician,
            tier=1,
            raw_input=text,
        )

    def _tier2_keyword(self, text: str, tech_id: str, active_task_id: str = "") -> Union[ParseResult, None]:
        text_lower = text.lower()
        best_failure = None
        best_match_len = 0

        for category, failures in FAILURE_KEYWORD_MAP.items():
            for failure_type, patterns in failures.items():
                for pattern in patterns:
                    match = re.search(pattern, text_lower)
                    if match:
                        match_len = len(match.group(0))
                        if match_len > best_match_len:
                            best_match_len = match_len
                            best_failure = failure_type

        if not best_failure:
            return None

        task_id = self._extract_task_id(text) or active_task_id
        if not task_id:
            return None

        return ParseResult(
            task_id=task_id,
            failure_type=best_failure,
            technician_id=tech_id,
            tier=2,
            raw_input=text,
        )

    def _tier3_llm(self, text: str, tech_id: str) -> ParseResult:
        key = cache_key(text, {"technician_id": tech_id})
        if self.cache:
            cached = self.cache.get(key)
            if cached:
                return ParseResult(
                    task_id=cached.get("resolved_state", ""),
                    failure_type=cached.get("resolved_failure_type", ""),
                    technician_id=tech_id,
                    tier=3,
                    cached=True,
                    raw_input=text,
                )

        resolved = self._call_llm(text, tech_id)

        if self.cache and resolved.task_id and resolved.failure_type:
            self.cache.set(key, resolved.task_id, resolved.failure_type)

        return resolved

    def _call_llm(self, text: str, tech_id: str) -> ParseResult:
        import os
        try:
            from openai import OpenAI
        except ImportError:
            return ParseResult(task_id="", failure_type="", technician_id=tech_id,
                               tier=3, raw_input=text, extra={"llm_status": "openai_not_installed"})

        api_key = os.environ.get("LLM_API_KEY")
        if not api_key:
            return ParseResult(task_id="", failure_type="", technician_id=tech_id,
                               tier=3, raw_input=text, extra={"llm_status": "no_api_key"})

        base_url = os.environ.get("LLM_BASE_URL")
        model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        client = OpenAI(**client_kwargs)

        failure_types = []
        for failures in FAILURE_KEYWORD_MAP.values():
            failure_types.extend(failures.keys())
        failure_list = "|".join(failure_types)

        active_tasks = self._active_task_ids if hasattr(self, '_active_task_ids') else []
        prompt = (
            f"Classify this field ops failure. Reply ONLY with this exact format:\n"
            f"TASK_ID|FAILURE_TYPE\n\n"
            f"Task IDs: {active_tasks or 'unknown'}\n"
            f"Failure types: {failure_list}\n"
            f"Message: \"{text}\"\n\n"
            f"Example: T03|TOOL_DAMAGED"
        )

        try:
            resp = client.chat.completions.create(
                model=model,
                max_tokens=40,
                temperature=0,
                messages=[{"role": "user", "content": prompt}],
            )
            raw_text = (resp.choices[0].message.content or "").strip()
        except Exception as exc:
            return ParseResult(task_id="", failure_type="", technician_id=tech_id,
                               tier=3, raw_input=text,
                               extra={"llm_status": "api_call_failed", "error": str(exc)[:120]})

        if not raw_text:
            return ParseResult(task_id="", failure_type="", technician_id=tech_id,
                               tier=3, raw_input=text, extra={"llm_status": "empty_response", "model": model})

        pipe_match = re.match(r'\s*([TS]\d{2,})\s*\|\s*(\w[\w_]*\w)\s*', raw_text, re.IGNORECASE)
        if pipe_match:
            return ParseResult(
                task_id=pipe_match.group(1).upper(),
                failure_type=self._normalize_failure_type(pipe_match.group(2)),
                technician_id=tech_id,
                tier=3,
                cached=False,
                raw_input=text,
                extra={"model": model},
            )

        try:
            data = json.loads(raw_text)
            return ParseResult(
                task_id=data.get("task_id") or data.get("task") or "",
                failure_type=data.get("failure_type") or data.get("failure") or "",
                technician_id=tech_id,
                tier=3,
                cached=False,
                raw_input=text,
                extra={"model": model},
            )
        except (json.JSONDecodeError, TypeError):
            pass

        json_match = re.search(r'\{[^}]+\}', raw_text)
        if json_match:
            try:
                data = json.loads(json_match.group())
                return ParseResult(
                    task_id=data.get("task_id") or data.get("task") or "",
                    failure_type=data.get("failure_type") or data.get("failure") or "",
                    technician_id=tech_id,
                    tier=3,
                    cached=False,
                    raw_input=text,
                    extra={"model": model},
                )
            except (json.JSONDecodeError, TypeError):
                pass

        task_from_llm = self._extract_task_id(raw_text)
        failure_from_llm = None
        for category, failures in FAILURE_KEYWORD_MAP.items():
            for failure_type, patterns in failures.items():
                for pattern in patterns:
                    if re.search(pattern, raw_text.lower()):
                        failure_from_llm = failure_type
                        break
                if failure_from_llm:
                    break
            if failure_from_llm:
                break

        if failure_from_llm:
            return ParseResult(
                task_id=task_from_llm or "",
                failure_type=failure_from_llm,
                technician_id=tech_id,
                tier=3,
                cached=False,
                raw_input=text,
                extra={"model": model, "llm_fallback": "keyword_on_llm_output"},
            )

        return ParseResult(task_id="", failure_type="", technician_id=tech_id,
                           tier=3, raw_input=text, extra={"llm_status": "unparseable", "model": model})

    @staticmethod
    def _extract_task_id(text: str) -> Union[str, None]:
        match = re.search(r"\b([TS]\d{2,})\b", text, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        return None

    @staticmethod
    def _normalize_failure_type(raw: str) -> str:
        raw_upper = raw.upper().replace(" ", "_")
        for failures in FAILURE_KEYWORD_MAP.values():
            if raw_upper in failures:
                return raw_upper
        for category, failures in FAILURE_KEYWORD_MAP.items():
            for failure in failures:
                if failure.replace("_", "") == raw_upper.replace("_", ""):
                    return failure
        return raw_upper
