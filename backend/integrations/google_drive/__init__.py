import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
_log = logging.getLogger(__name__)


class GoogleDriveUploader:
    def __init__(self, token_path: str, root_folder_id: str) -> None:
        self.root_folder_id = root_folder_id
        token_path_obj = Path(token_path)
        raw = json.loads(token_path_obj.read_text(encoding="utf-8"))

        creds = Credentials(
            token=raw.get("token"),
            refresh_token=raw.get("refresh_token"),
            token_uri=raw.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=raw.get("client_id"),
            client_secret=raw.get("client_secret"),
            scopes=raw.get("scopes", SCOPES),
        )
        self.service = build("drive", "v3", credentials=creds)

    def _ensure_folder(self, folder_name: str, parent_id: str) -> str:
        query = (
            f"name='{folder_name.replace(chr(39), chr(92) + chr(39))}'"
            f" and mimeType='application/vnd.google-apps.folder'"
            f" and '{parent_id}' in parents and trashed=false"
        )
        try:
            results = (
                self.service.files()
                .list(q=query, fields="files(id)", pageSize=1)
                .execute()
            )
            files = results.get("files", [])
            if files:
                return files[0]["id"]
        except HttpError as e:
            _log.warning("Folder lookup failed, will create: %s", e)

        metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_id],
        }
        folder = (
            self.service.files()
            .create(body=metadata, fields="id")
            .execute()
        )
        return folder["id"]

    def upload(self, file_path: str, file_name: str, sender_name: str) -> Optional[str]:
        try:
            folder_id = self._ensure_folder(sender_name, self.root_folder_id)
            media = MediaFileUpload(file_path, resumable=True)
            metadata = {"name": file_name, "parents": [folder_id]}
            uploaded = (
                self.service.files()
                .create(body=metadata, media_body=media, fields="id,webViewLink")
                .execute()
            )
            return uploaded.get(
                "webViewLink",
                f"https://drive.google.com/file/d/{uploaded['id']}/view",
            )
        except HttpError as e:
            _log.error("Google Drive upload failed: %s", e)
            return None


_uploader: Optional[GoogleDriveUploader] = None


def get_uploader() -> Optional[GoogleDriveUploader]:
    global _uploader
    return _uploader


def init_uploader(token_path: str, root_folder_id: str) -> GoogleDriveUploader:
    global _uploader
    _uploader = GoogleDriveUploader(token_path, root_folder_id)
    return _uploader
