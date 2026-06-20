class StubNotifier:
    def __init__(self, sb_client=None):
        self.sb = sb_client

    def alert(self, role: str, payload: str) -> None:
        print(f"ALERT [{role}] - {payload}")
        if self.sb:
            self.sb.table("alerts").insert({
                "target_role": role,
                "category": "workflow",
                "message": payload,
                "status": "pending",
            }).execute()

    def notify(self, recipient: str, message: str) -> None:
        print(f"NOTIFICATION [{recipient}] - {message}")
