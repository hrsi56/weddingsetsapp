from typing import List
from sqlalchemy.orm import Session
from backend.db import User, Seat

# ─────────────────────────────────────────────────────────────────────────────
#  USERS
# ─────────────────────────────────────────────────────────────────────────────
def get_user_by_phone(db: Session, phone: str) -> User | None:
    return db.query(User).filter(User.phone == phone).first()

def create_user(db: Session, payload: dict) -> User:
    """
    payload example: { "name": "...", "phone": "...", "user_type": "...", ... }
    """
    user = User(**payload)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, data: dict) -> User | None:
    """
    עדכן שדות קיימים במודל User ולחזור על האובייקט.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    for key, val in data.items():
        setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return user

def all_users(db: Session) -> List[User]:
    return db.query(User).all()

# ─────────────────────────────────────────────────────────────────────────────
#  SEATS
# ─────────────────────────────────────────────────────────────────────────────
def all_seats(db: Session) -> List[Seat]:
    return db.query(Seat).all()

def assign_seats(db: Session, seat_ids: List[int], user_id: int) -> None:
    """
    משחרר קודם כל כיסאות שייכים למשתמש, ואז מסמן free⇒taken על ה‐seat_ids החדשים.
    """
    # 1) שחרור כיסאות קיימים ל‐user_id
    db.query(Seat).filter(Seat.owner_id == user_id).update(
        {"status": "free", "owner_id": None}, synchronize_session=False
    )

    # 2) סמן ישיבה חדשה כ‐taken + עדכן owner_id
    if seat_ids:
        db.query(Seat).filter(Seat.id.in_(seat_ids)).update(
            {"status": "taken", "owner_id": user_id}, synchronize_session=False
        )

    db.commit()