# Google Gemini OCR client — sends images / PDFs to Gemini 3.1 Flash-Lite
import mimetypes
from pathlib import Path

from google import genai
from google.genai import types

from . import config

MODEL = "gemini-3.1-flash-lite"
PROMPT = "Extract all text from this image. Return only the raw text with no explanation, no markdown formatting."

_client = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


def ocr_image_bytes(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=[PROMPT, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
    )
    return response.text.strip()


def ocr_image_file(file_path: str) -> str:
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "image/jpeg"
    with open(file_path, "rb") as f:
        return ocr_image_bytes(f.read(), mime_type)


def ocr_pdf_bytes(pdf_bytes: bytes) -> str:
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=[PROMPT, types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")],
    )
    return response.text.strip()


def ocr_pdf_file(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return ocr_pdf_bytes(f.read())
