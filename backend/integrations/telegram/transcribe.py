# Voice transcription via faster-whisper (CTranslate2 backend, CPU int8)
from faster_whisper import WhisperModel

_model = None


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel("small", device="cpu", compute_type="int8")
    return _model


def preload_model() -> None:
    _get_model()


def translate_audio(audio_path: str) -> str:
    model = _get_model()
    segments, _ = model.transcribe(audio_path, task="translate")
    text = " ".join(segment.text for segment in segments)
    return text.strip()
