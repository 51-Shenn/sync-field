# Environment config — all secrets loaded from .env file
import os
from dotenv import load_dotenv

load_dotenv()

API_ID = int(os.environ["API_ID"])
API_HASH = os.environ["API_HASH"]
BOT_TOKEN = os.environ["BOT_TOKEN"]
TARGET_CHAT = os.environ["TARGET_CHAT"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
