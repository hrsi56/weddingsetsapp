# backend/google_sheets.py

import os
import base64
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials

def get_client():
    """
    - קורא את הסוד המקודד בבסיס64 מה־ENV var GCP_SA_JSON
    - מפענח אותו למילון (dict)
    - יוצר Credentials עבור Google Sheets ו-Drive
    - מאתחל ומחזיר gspread.Client
    """
    # 1) שליפת הסוד מה-env
    b64 = os.getenv("GCP_SA_JSON")
    if not b64:
        raise RuntimeError("Environment variable GCP_SA_JSON not set")

    # 2) המרה חזרה ל-dict
    try:
        creds_dict = json.loads(base64.b64decode(b64))
    except Exception as e:
        raise RuntimeError(f"Error decoding GCP_SA_JSON: {e}")

    # 3) הרשאות Google Sheets + Drive
    SCOPES = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    # 4) יצירת Credentials
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scopes=SCOPES)
    return gspread.authorize(creds)

def open_sheet(sheet_name: str):
    """
    פותח את הגיליון בשמו הנתון (sheet_name) ומחזיר את האובייקט Spreadsheet.
    """
    client = get_client()
    return client.open(sheet_name)