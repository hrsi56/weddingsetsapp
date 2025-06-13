from pathlib import Path
from dotenv import load_dotenv

try:
    env_path = Path("/etc/secrets/.env")
    if env_path.exists():
        # override=True מחליף placeholders בערכים האמיתיים
        load_dotenv(env_path, override=True)      # <<< שינוי כאן
        print("✅ /etc/secrets/.env loaded (override)")
except Exception as exc:
    print(f"ℹ️ skipping Render .env load: {exc}")