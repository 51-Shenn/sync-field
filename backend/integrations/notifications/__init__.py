from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def alert(self, role: str, payload: str) -> None: ...

    @abstractmethod
    def notify(self, recipient: str, message: str) -> None: ...
