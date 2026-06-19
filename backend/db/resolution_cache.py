import hashlib
import json
from typing import Union
from supabase import Client


def cache_key(message: str, context: dict) -> str:
    normalized = message.lower().strip()
    context_str = json.dumps(context, sort_keys=True)
    return hashlib.sha256(f"{normalized}|{context_str}".encode()).hexdigest()


class ResolutionCache:
    def __init__(self, sb: Client):
        self.sb = sb

    def get(self, key: str) -> Union[dict, None]:
        result = self.sb.table("resolution_cache") \
            .select("resolved_state, resolved_failure_type") \
            .eq("cache_key", key) \
            .maybe_single() \
            .execute()
        if result.data:
            self.sb.table("resolution_cache") \
                .update({"hit_count": self.sb.raw("hit_count + 1")}) \
                .eq("cache_key", key) \
                .execute()
            return result.data
        return None

    def set(self, key: str, state: str, failure_type: Union[str, None]) -> None:
        self.sb.table("resolution_cache").upsert({
            "cache_key": key,
            "resolved_state": state,
            "resolved_failure_type": failure_type,
        }).execute()
