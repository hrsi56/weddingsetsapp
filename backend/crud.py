from typing import List

from sqlalchemy import func
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
    מוודא תחילה שהכיסאות החדשים לא נתפסו כבר על ידי מישהו אחר כדי למנוע התנגשויות.
    """
    if seat_ids:
        # בדיקה האם אחד מהכיסאות המבוקשים כבר שייך למישהו אחר
        taken_by_others = db.query(Seat).filter(
            Seat.id.in_(seat_ids),
            Seat.owner_id.isnot(None),
            Seat.owner_id != user_id
        ).first()

        if taken_by_others:
            raise ValueError("אופס! אחד או יותר מהמקומות שניסית לתפוס נתפסו כרגע על ידי מארחת אחרת.")

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


def create_new_table(db: Session, area: str, capacity: int = 12) -> int:
    """
    מוצא את מספר השולחן (col) המקסימלי באזור הנתון,
    ומייצר שולחן חדש עם כמות המקומות המבוקשת (ברירת מחדל 12).
    """
    # חיפוש מספר השולחן הכי גבוה באזור
    max_col = db.query(func.max(Seat.col)).filter(Seat.area == area).scalar() or 0
    new_col = max_col + 1

    new_seats = []
    for row in range(1, capacity + 1):
        new_seat = Seat(row=row, col=new_col, area=area, status="free", owner_id=None)
        new_seats.append(new_seat)

    db.add_all(new_seats)
    db.commit()
    return new_col