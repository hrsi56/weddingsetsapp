# backend/db.py

import os
import sqlalchemy as sa
from sqlalchemy.orm import declarative_base, relationship, sessionmaker,Session
from typing import List

# ─────────────────────────────────────────────────────
# 💾 חיבור ל-PostgreSQL (למשל Supabase)
# ─────────────────────────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://USERNAME:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
)

if "USERNAME" in DATABASE_URL:
    raise RuntimeError("❗ נא להגדיר DATABASE_URL בסביבת הריצה (.env או Docker)")

# יצירת מנוע SQLAlchemy
engine = sa.create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False  # שנה ל-True אם אתה רוצה לוג SQL במסך
)

# יצירת Session ו-Base
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# ─────────────────────────────────────────────────────
# 🧍 טבלת משתמשים
# ─────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = sa.Column(sa.Integer, primary_key=True, index=True)
    name          = sa.Column(sa.Text, nullable=False)
    phone         = sa.Column(sa.Text, nullable=False, unique=True)
    Phone2        = sa.Column(sa.Text, nullable=True)  # העמודה החדשה
    user_type     = sa.Column(sa.Text, nullable=True)  # לדוגמה: "אורח", "מנהל"
    reserve_count = sa.Column(sa.Integer, default=0)
    num_guests    = sa.Column(sa.Integer, default=1)
    is_coming     = sa.Column(sa.Text, nullable=True)   # ערכים: "כן"/"לא"/None
    area          = sa.Column(sa.Text, nullable=True)
    vegan = sa.Column(sa.Integer, default=0)
    kids = sa.Column(sa.Integer, default=0)
    meat = sa.Column(sa.Integer, default=0)
    glutenfree = sa.Column(sa.Integer, default=0)


    # יחס one-to-many אל כיסאות
    seats = relationship("Seat", back_populates="owner", cascade="all, delete-orphan")

# ─────────────────────────────────────────────────────
# 🪑 טבלת מקומות ישיבה
# ─────────────────────────────────────────────────────
class Seat(Base):
    __tablename__ = "seats"

    id       = sa.Column(sa.Integer, primary_key=True, index=True)
    row      = sa.Column(sa.Integer, nullable=False)
    col      = sa.Column(sa.Integer, nullable=False)
    area     = sa.Column(sa.Text, nullable=True)
    status   = sa.Column(sa.Text, default="free")  # ערכים: "free" / "taken"

    owner_id = sa.Column(sa.Integer, sa.ForeignKey("users.id"), nullable=True)
    owner    = relationship("User", back_populates="seats")

# ─────────────────────────────────────────────────────
# 🧱 אתחול בסיס הנתונים (יצירת טבלאות אוטומטית)
# ─────────────────────────────────────────────────────
def init_db():
    Base.metadata.create_all(bind=engine)



def get_unique_user_areas(db: Session) -> List[str]:
    """
    שולף את רשימת האזורים הקיימים אצל משתמשים בלבד (ללא כפילויות).
    מסנן ערכי NULL.
    """
    # שליפת ערכים ייחודיים מעמודת area
    results = db.query(User.area).distinct().filter(User.area != None).all()

    # התוצאה חוזרת כרשימה של Tuples (למשל [('Garden',), ('Hall',)])
    # אנחנו הופכים אותה לרשימה רגילה של מחרוזות, ומסננים מחרוזות ריקות אם יש
    return sorted([r[0] for r in results if r[0] and r[0].strip() != ""])