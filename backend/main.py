# backend/main.py

import os
import json
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import sqlalchemy as sa

from backend.db import SessionLocal, init_db, User, Seat
import backend.schemas as schemas
import backend.crud as crud
import backend.sheets_repo as sheets

# ─────────────────────────────────────────────────────────────────────────────
#  FastAPI + Router + CORS
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Wedding API", version="0.1.0")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # בפיתוח ניתן להשאיר כמו זה; בפרודקשן – צמצם לדומיין שלך
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

# ═════════════════════════════════════════════════════════════════════════════
#  USERS (כל הנתיבים תחת /api/users)
# ═════════════════════════════════════════════════════════════════════════════
@api.post("/users/login", response_model=schemas.UserOut)
def login(data: schemas.UserBase, db: Session = Depends(get_db)):
    """
    התחברות / רישום מהיר של אורח.
    אם אין משתמש קיים עם המספר, נוצר חדש.
    """
    user = crud.get_user_by_phone(db, data.phone)
    if not user:
        user = crud.create_user(
            db,
            {
                "name": data.name,
                "phone": data.phone,
                "user_type": "אורח לא רשום",
            },
        )
    return user

@api.get("/users", response_model=list[schemas.UserOut])
def list_users(
        q: str | None = Query(None, description="Search by name or phone"),
        db: Session = Depends(get_db),
):
    """
    החזר את כל המשתמשים, או – אם קיים פרמטר q – בצע חיפוש על השם או הטלפון.
    """
    qry = db.query(User)
    if q:
        like = f"%{q}%"
        qry = qry.filter(
            sa.or_(
                User.name.ilike(like),
                User.phone.ilike(like),
            )
        )
    return qry.all()

@api.post("/users", response_model=schemas.UserOut, status_code=201)
def create_user_endpoint(data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    צור משתמש חדש (אם הטלפון לא קיים כבר).
    """
    if crud.get_user_by_phone(db, data.phone):
        raise HTTPException(status_code=400, detail="Phone already registered")
    return crud.create_user(db, data.dict())

# backend/main.py

@api.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user_endpoint(user_id: int, payload: dict, db: Session = Depends(get_db)):
    """
    עדכן שדות של משתמש קיים לפי ID.
    הנתיב הזה יודע לטפל גם בפרטי המשתמש וגם בשיבוץ הכיסאות שלו.
    """
    # 1. בדוק אם יש מידע על כיסאות ב-payload
    seat_ids = payload.pop("seat_ids", None)

    try:
        # 2. עדכן את פרטי המשתמש (עם ה-payload שנשאר אחרי הסרת הכיסאות)
        user = crud.update_user(db, user_id, payload)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 3. אם נשלחו כיסאות, קרא לפונקציה של שיבוץ הכיסאות
        if seat_ids is not None:
            crud.assign_seats(db, seat_ids, user_id)

        # 4. בצע commit כדי לשמור את כל השינויים (גם במשתמש וגם בכיסאות)
        db.commit()
        db.refresh(user) # רענן את אובייקט המשתמש כדי שיכיל את הנתונים המעודכנים

    except Exception as e:
        db.rollback() # במקרה של שגיאה, בטל את כל השינויים
        # מומלץ להוסיף לוג של השגיאה
        print(f"Error updating user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during update")

    return user



@api.put("/users/{uid}/coming")
def coming_endpoint(uid: int, payload: schemas.ComingIn, db: Session = Depends(get_db)):
    """
    עדכן האם המשתמש מגיע (כן/לא).
    """
    crud.update_user(db, uid, {"is_coming": "כן" if payload.coming else "לא"})
    return {"ok": True}

# ═════════════════════════════════════════════════════════════════════════════
#  SEATS (כל הנתיבים תחת /api/seats)
# ═════════════════════════════════════════════════════════════════════════════
@api.get("/seats", response_model=list[schemas.SeatOut])
def list_seats(db: Session = Depends(get_db)):
    """
    החזר את כל הכיסאות (עם מצבם – free/taken – ו־owner_id).
    """
    return crud.all_seats(db)

@api.get("/seats/user/{uid}", response_model=list[schemas.SeatOut])
def seats_by_user(uid: int, db: Session = Depends(get_db)):
    """
    החזר את כיסאות ה‐user המסוים לפי uid (למסך כל אורח).
    """
    return db.query(Seat).filter(Seat.owner_id == uid).all()

@api.put("/seats/assign")
def assign_seats_endpoint(payload: dict, db: Session = Depends(get_db)):
    """
    קבל body: { "seat_ids": [int], "user_id": int }
    השתחרר כיסאות ישנים של המשתמש ואז צבען ל־taken ולמלא owner_id.
    """
    crud.assign_seats(db, payload["seat_ids"], payload["user_id"])
    return {"ok": True}

# ═════════════════════════════════════════════════════════════════════════════
#  BLESSINGS (Google Sheets)
# ═════════════════════════════════════════════════════════════════════════════
@api.post("/blessing")
def add_blessing_endpoint(data: schemas.BlessingIn):
    """
    שמירת ברכה לזוג בגיליון Google Sheets.
    """
    sheets.add_blessing(data.name, data.blessing)
    return {"ok": True}

# ═════════════════════════════════════════════════════════════════════════════
#  SINGLES CORNER (Google Sheets)
# ═════════════════════════════════════════════════════════════════════════════
@api.get("/singles")
def list_singles_endpoint():
    """
    החזר רשימת רווקים/רווקות מה־Google Sheets.
    """
    return sheets.list_singles()

@api.post("/singles")
def add_single_endpoint(data: schemas.SingleIn):
    """
    הוסף רווק/ה חדש/ה ל־Google Sheets.
    """
    sheets.add_single(data.name, data.gender, data.about)
    return {"ok": True}

# ═════════════════════════════════════════════════════════════════════════════
#  FEEDBACK (Google Sheets)
# ═════════════════════════════════════════════════════════════════════════════
@api.post("/feedback")
def add_feedback_endpoint(data: schemas.FeedbackIn):
    """
    מקבל {'name': str, 'feedback': str} ויודע להוסיף לגליון הפידבק
    """
    sheets.add_feedback(data.name, data.feedback)
    return {"ok": True}

# ─────────────────────────────────────────────────────────────────────────────
#  רשום את ה-API Router תחת prefix /api
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(api)

# ─────────────────────────────────────────────────────────────────────────────
#  צרף את תיקיית ה-`static/` (הכילה את build של React) כאחסון סטטי
#  כאשר כל קריאה ל־"/..." תחזיר קובץ מתוך static אם קיים.
# ─────────────────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# ─────────────────────────────────────────────────────────────────────────────
#  Fallback: לכל כתובת שאינה מתחילה ב־/api ושאין לה קובץ קיים ב־static,
#  נחזיר תמיד את static/index.html כדי לטעון את SPA של React.
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    return FileResponse("static/index.html")