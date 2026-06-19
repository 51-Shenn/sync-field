class StubNotifier:
    def alert(self, role: str, payload: str) -> None:
        print(f"\U0001f514 NOTIFICATION: Alerting role [{role}] — {payload}")

    def notify(self, recipient: str, message: str) -> None:
        print(f"\U0001f4e9 NOTIFICATION: [{recipient}] — {message}")
