from pathlib import Path
from dotenv import load_dotenv

try:
    # ברנדר Secret Files ממופים לנתיב הזה
    dotenv_path = Path("/etc/secrets/.env")
    if dotenv_path.exists():
        load_dotenv(dotenv_path)
        print("✅ .env from /etc/secrets loaded")
except Exception as exc:
    # אפשר להחליף בלוגר שלכם במקום print
    print(f"ℹ️  skipping Render .env load: {exc}")