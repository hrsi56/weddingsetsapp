# backend/main.py

import os
import hmac
import hashlib
import time
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import sqlalchemy as sa

from backend.db import SessionLocal, init_db, User, Seat, get_unique_user_areas
import backend.schemas as schemas
import backend.crud as crud
import backend.sheets_repo as sheets

# ─────────────────────────────────────────────────────────────────────────────
#  FastAPI + Router + CORS
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Wedding API", version="0.1.0")
api = APIRouter(prefix="/api")

origins = [
    "https://wedding-app-s8y1.onrender.com",
    "https://www.yarden-tovat.info",
    "https://yarden-tovat.info",
    "https://tovat-yarden.info",
    "https://www.tovat-yarden.info",
    "http://localhost:3000",
    "https://wedding-app-s8y1.onrender.com/",
    "https://www.yarden-tovat.info/",
    "https://yarden-tovat.info/",
    "https://tovat-yarden.info/",
    "https://www.tovat-yarden.info/",
    "http://localhost:3000/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
#  DB Dependency
# ─────────────────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    init_db()


# ─────────────────────────────────────────────────────────────────────────────
#  TOKEN AUTH (HMAC-SHA256)
#
#  פורמט הטוקן: "<timestamp_unix>.<hmac_hex>"
#  הסוד: משתנה סביבה ADMIN_SECRET (מוגדר ב-Render).
#  תוקף: 12 שעות מרגע ההנפקה.
#
#  ⚠️  זה לא JWT מלא, אך מספיק לאירוע חד-פעמי ללא תלויות חיצוניות.
# ─────────────────────────────────────────────────────────────────────────────
_SECRET  = os.getenv("ADMIN_SECRET", "dev-secret-change-me").encode()
TOKEN_TTL = 12 * 60 * 60   # 12 שעות


def _make_token() -> str:
    ts  = str(int(time.time()))
    sig = hmac.new(_SECRET, ts.encode(), hashlib.sha256).hexdigest()
    return f"{ts}.{sig}"


def _verify_token(token: str | None) -> bool:
    if not token:
        return False
    try:
        ts_str, sig = token.split(".", 1)
        expected = hmac.new(_SECRET, ts_str.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return False
        return (int(time.time()) - int(ts_str)) < TOKEN_TTL
    except Exception:
        return False


def require_admin(x_admin_token: str | None = Header(None)) -> None:
    """
    FastAPI Dependency – מגן על נתיבי אדמין.
    מצפה ל: x-admin-token: <token>  בכותרות הבקשה.
    """
    if not _verify_token(x_admin_token):
        raise HTTPException(
            status_code=401,
            detail="Admin token missing or expired. Please log in again.",
        )


# ─────────────────────────────────────────────────────────────────────────────
#  PII MASKING HELPER
#  ⚠️  בונה dict חדש – לעולם אל תשנה u.name / u.phone ישירות!
#      SQLAlchemy עוקב אחרי שינויים ועלול לשמור ערכים מצונזרים ל-DB.
# ─────────────────────────────────────────────────────────────────────────────
def _mask_phone(phone: str | None) -> str | None:
    if not phone or len(phone) <= 3:
        return phone
    return "*" * (len(phone) - 3) + phone[-3:]


def mask_user(u: User) -> dict:
    parts       = u.name.split() if u.name else []
    masked_name = f"{parts[0]} {parts[-1][0]}'" if len(parts) > 1 else (u.name or "")
    return {
        "id":            u.id,
        "name":          masked_name,
        "phone":         _mask_phone(u.phone),
        "Phone2":        _mask_phone(u.Phone2),
        "user_type":     u.user_type,
        "num_guests":    u.num_guests,
        "reserve_count": u.reserve_count,
        "is_coming":     u.is_coming,
        "area":          u.area,
        "vegan":         getattr(u, "vegan", None),
        "kids":          getattr(u, "kids", None),
        "SpecialMeal":   getattr(u, "SpecialMeal", None),
        "meat":          getattr(u, "meat", None),
        "glutenfree":    getattr(u, "glutenfree", None),
    }


# ═════════════════════════════════════════════════════════════════════════════
#  ADMIN AUTH ENDPOINT  ← חייב להיות לפני app.include_router!
# ═════════════════════════════════════════════════════════════════════════════

class AdminLoginIn(BaseModel):
    phone: str


@api.post("/users/admin-login")
def admin_login(data: AdminLoginIn):
    """
    בודק מול ADMIN_PHONES בשרת בלבד.
    מחזיר טוקן חתום אם מורשה – לא חושף את הרשימה לצד הלקוח.
    """
    admin_phones = {
        p.strip()
        for p in os.getenv("ADMIN_PHONES", "").split(",")
        if p.strip()
    }
    if data.phone.strip() not in admin_phones:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"ok": True, "token": _make_token()}


# ═════════════════════════════════════════════════════════════════════════════
#  USERS
# ═════════════════════════════════════════════════════════════════════════════

@api.post("/users/login", response_model=schemas.UserOut)
def login(data: schemas.UserBase, db: Session = Depends(get_db)):
    """התחברות / רישום מהיר של אורח – לא דורש טוקן אדמין."""
    user = db.query(User).filter(
        sa.or_(User.phone == data.phone, User.Phone2 == data.phone)
    ).first()
    if not user:
        user = crud.create_user(db, {
            "name":      data.name,
            "phone":     data.phone,
            "user_type": "אורח לא רשום",
        })
    return user


@api.get("/users/check-phone")
def check_phone_endpoint(phone: str = Query(...), db: Session = Depends(get_db)):
    """בדיקת קיום מספר טלפון – ללא החזרת מידע אישי."""
    exists = db.query(User).filter(
        sa.or_(User.phone == phone.strip(), User.Phone2 == phone.strip())
    ).first() is not None
    return {"exists": exists}


_GUEST_SEARCH_MIN = 2

@api.get("/users/guest-search")
def guest_search_endpoint(q: str = Query(...), db: Session = Depends(get_db)):
    """חיפוש לאורחים – מחזיר נתונים מצונזרים בלבד."""
    q = q.strip()
    if len(q) < _GUEST_SEARCH_MIN:
        return []
    qry = db.query(User)
    if q.isdigit():
        if len(q) != 10:
            return []
        qry = qry.filter(sa.or_(User.phone == q, User.Phone2 == q))
    else:
        qry = qry.filter(User.name.ilike(f"%{q}%"))
    return [mask_user(u) for u in qry.all()]


@api.get("/users/guest-areas", response_model=list[str])
def guest_areas_endpoint(db: Session = Depends(get_db)):
    """רשימת אזורים – פתוח לאורחים."""
    return get_unique_user_areas(db)


_RSVP_ALLOWED_FIELDS = {"num_guests", "reserve_count", "area", "vegan", "kids", "meat", "glutenfree", "SpecialMeal"}

@api.put("/users/{uid}/rsvp")
def update_rsvp_endpoint(uid: int, payload: dict, db: Session = Depends(get_db)):
    """עדכון פרטי הגעה לאורח – מגביל שדות לפרטי RSVP בלבד."""
    filtered = {k: v for k, v in payload.items() if k in _RSVP_ALLOWED_FIELDS}
    user = crud.update_user(db, uid, filtered)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@api.get("/users/areas", response_model=list[str])
def get_areas(
    db: Session = Depends(get_db),
    _:  None    = Depends(require_admin),
):
    return get_unique_user_areas(db)


@api.get("/users", response_model=list[schemas.UserOut])
def list_users(
    q:  str | None = Query(None),
    db: Session    = Depends(get_db),
    _:  None       = Depends(require_admin),
):
    qry = db.query(User)
    if q:
        q = q.strip()
        if q.isdigit():
            if len(q) != 10:
                return []
            qry = qry.filter(sa.or_(User.phone == q, User.Phone2 == q))
        else:
            qry = qry.filter(User.name.ilike(f"%{q}%"))
    return [mask_user(u) for u in qry.all()]


@api.post("/users", response_model=schemas.UserOut, status_code=201)
def create_user_endpoint(
    data: schemas.UserCreate,
    db:   Session = Depends(get_db),
    _:    None    = Depends(require_admin),
):
    if crud.get_user_by_phone(db, data.phone):
        raise HTTPException(status_code=400, detail="Phone already registered")
    user = crud.create_user(db, data.dict())
    return mask_user(user)


@api.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user_endpoint(
    user_id: int,
    payload: dict,
    db:      Session = Depends(get_db),
    _:       None    = Depends(require_admin),
):
    seat_ids = payload.pop("seat_ids", None)
    try:
        user = crud.update_user(db, user_id, payload)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if seat_ids is not None:
            try:
                crud.assign_seats(db, seat_ids, user_id)
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))

        db.commit()
        db.refresh(user)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return mask_user(user)


@api.put("/users/{uid}/coming")
def coming_endpoint(uid: int, payload: schemas.ComingIn, db: Session = Depends(get_db)):
    """פתוח לאורחים עצמאיים (אישור הגעה עצמי) – אין require_admin."""
    crud.update_user(db, uid, {"is_coming": "כן" if payload.coming else "לא"})
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════════════
#  SEATS
# ═════════════════════════════════════════════════════════════════════════════

@api.get("/seats", response_model=list[schemas.SeatOut])
def list_seats(
    db: Session = Depends(get_db),
    _:  None    = Depends(require_admin),
):
    return crud.all_seats(db)


@api.get("/seats/user/{uid}", response_model=list[schemas.SeatOut])
def seats_by_user(uid: int, db: Session = Depends(get_db)):
    """פתוח לאורח עצמו."""
    return db.query(Seat).filter(Seat.owner_id == uid).all()


@api.put("/seats/assign")
def assign_seats_endpoint(
    payload: dict,
    db:      Session = Depends(get_db),
    _:       None    = Depends(require_admin),
):
    try:
        crud.assign_seats(db, payload["seat_ids"], payload["user_id"])
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    return {"ok": True}


@api.post("/seats/table")
def create_table_endpoint(
    payload: dict,
    db:      Session = Depends(get_db),
    _:       None    = Depends(require_admin),
):
    area     = payload.get("area")
    capacity = payload.get("capacity", 12)
    if not area:
        raise HTTPException(status_code=400, detail="Area is required")
    new_col = crud.create_new_table(db, area, capacity)
    return {"ok": True, "new_col": new_col}


@api.delete("/seats/table")
def delete_table_endpoint(
    area: str,
    col:  int,
    db:   Session = Depends(get_db),
    _:    None    = Depends(require_admin),
):
    crud.delete_table(db, area, col)
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════════════
#  BLESSINGS / SINGLES / FEEDBACK  (פתוחים לכולם)
# ═════════════════════════════════════════════════════════════════════════════

@api.post("/blessing")
def add_blessing_endpoint(data: schemas.BlessingIn):
    try:
        sheets.add_blessing(data.name, data.blessing)
        return {"ok": True}
    except Exception as e:
        print(f"Google Sheets Error (Blessing): {e}")
        raise HTTPException(status_code=503, detail="שגיאה מול השרתים של גוגל.")


@api.get("/blessing")
def get_blessings_endpoint():
    try:
        return sheets.get_blessings()
    except Exception as e:
        print(f"Google Sheets Error (Get Blessings): {e}")
        return []


@api.get("/singles")
def list_singles_endpoint():
    try:
        return sheets.list_singles()
    except Exception as e:
        print(f"Google Sheets Error (Get Singles): {e}")
        raise HTTPException(status_code=503, detail="לא הצלחנו לטעון את הרשימה.")


@api.post("/singles")
def add_single_endpoint(data: schemas.SingleIn):
    try:
        sheets.add_single(data.name, data.gender, data.about)
        return {"ok": True}
    except Exception as e:
        print(f"Google Sheets Error (Add Single): {e}")
        raise HTTPException(status_code=503, detail="שגיאה מול השרתים של גוגל.")


@api.post("/feedback")
def add_feedback_endpoint(data: schemas.FeedbackIn):
    try:
        sheets.add_feedback(data.name, data.feedback)
        return {"ok": True}
    except Exception as e:
        print(f"Google Sheets Error (Feedback): {e}")
        raise HTTPException(status_code=503, detail="שגיאה מול השרתים של גוגל.")


# ─────────────────────────────────────────────────────────────────────────────
#  ROUTER + SPA FALLBACK
#  ⚠️  include_router חייב להיות אחרי כל הגדרות הנתיבים ב-api router
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(api)


@app.get("/{catchall:path}")
def serve_react_app(catchall: str):
    file_path = os.path.join("static", catchall)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse("static/index.html")
