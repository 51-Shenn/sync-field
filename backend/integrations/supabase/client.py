import os
from supabase import create_client, create_async_client, Client
import supabase as _supabase

_sync_client: Client | None = None
_async_client: "supabase.AsyncClient | None" = None


def get_supabase_client() -> Client:
    global _sync_client
    if _sync_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        _sync_client = create_client(url, key)
    return _sync_client


async def get_supabase_async_client() -> "supabase.AsyncClient":
    global _async_client
    if _async_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        _async_client = await create_async_client(url, key)
    return _async_client
