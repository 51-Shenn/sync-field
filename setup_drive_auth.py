#!/usr/bin/env python3
"""One-time setup: obtain a Google Drive refresh token.

Reads GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET from .env.

For Desktop OAuth clients: opens your browser (run_local_server).
For Web OAuth clients: uses out-of-band flow if possible.
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import google_auth_oauthlib.flow

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
TOKEN_PATH = Path(__file__).parent / "drive_token.json"

client_id = os.environ.get("GOOGLE_DRIVE_CLIENT_ID", "")
client_secret = os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET", "")

if not client_id or not client_secret:
    print("❌ GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET not found in .env")
    sys.exit(1)

print(f"Using Client ID: {client_id[:30]}...")
print()

client_config = {
    "installed": {
        "client_id": client_id,
        "client_secret": client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": ["http://localhost"],
    }
}

flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_config(client_config, SCOPES)
creds = flow.run_local_server(open_browser=True, port=0)

token_data = {
    "token": creds.token,
    "refresh_token": creds.refresh_token,
    "token_uri": creds.token_uri,
    "client_id": client_id,
    "client_secret": client_secret,
    "scopes(list)": list(creds.scopes),
    "expiry": creds.expiry.isoformat() if creds.expiry else None,
}

TOKEN_PATH.write_text(json.dumps(token_data, indent=2))
print(f"\n✅ Drive token saved to {TOKEN_PATH}")
print("Ready to start the bot.")
