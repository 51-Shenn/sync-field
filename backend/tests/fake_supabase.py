# backend/tests/fake_supabase.py


class FakeQuery:
    def __init__(self, data):
        self.data = data

    def select(self, *args, **kwargs):
        return self

    def execute(self):
        return self


class FakeTable:
    def __init__(self, data):
        self._data = data

    def select(self, *args, **kwargs):
        return FakeQuery(self._data)


class FakeSupabaseClient:
    def __init__(self, dataset=None):
        self._dataset = dataset or []

    def table(self, name: str) -> FakeTable:
        if name != "tasks":
            raise ValueError(
                f"Querying table '{name}' is not mocked in this harness."
            )
        return FakeTable(self._dataset)
