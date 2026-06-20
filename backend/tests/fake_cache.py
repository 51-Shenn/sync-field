"""
In-memory stand-in for ResolutionCache, matching its real method signatures
exactly (including the 3-arg `set`) so calling code that's wrong against the
real interface fails here too, instead of being silently masked by a looser
mock.
"""


class FakeSbResult:
    def __init__(self, data=None):
        self.data = data


class InMemoryResolutionCache:
    def __init__(self):
        self.store = {}
        self.hits = 0

    def get(self, key):
        if key in self.store:
            self.hits += 1
            return self.store[key]
        return None

    def set(self, key, state, failure_type):
        self.store[key] = {"resolved_state": state, "resolved_failure_type": failure_type}

    @property
    def sb(self):
        raise AttributeError(
            "InMemoryResolutionCache has no `.sb` — if code reaches this, "
            "it's trying to call real Supabase methods on a fake cache, "
            "which is exactly the kind of interface mismatch this harness "
            "is meant to catch."
        )
