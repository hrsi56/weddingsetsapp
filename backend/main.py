# backend/main.py

import os
import json
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
	"http://localhost:3000",  # מומלץ להשאיר לפיתוח מקומי
	"https://wedding-app-s8y1.onrender.com/",
	"https://www.yarden-tovat.info/",
	"https://yarden-tovat.info/",
	"https://tovat-yarden.info/",
	"https://www.tovat-yarden.info/",
	"http://localhost:3000/",  # מומלץ להשאיר לפיתוח מקומי
]

app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,  # עכשיו תוכל להשתמש בזה בבטחה
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
	מחפש את הטלפון בעמודות phone ו-Phone2. אם לא נמצא, נוצר משתמש חדש.
	"""
	# חיפוש המשתמש לפי מספר הטלפון שהוזן בשתי העמודות האפשריות
	user = db.query(User).filter(
		sa.or_(User.phone == data.phone, User.Phone2 == data.phone)
	).first()

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


@api.get("/users/areas", response_model=list[str])
def get_areas(db: Session = Depends(get_db)):
	return get_unique_user_areas(db)


@api.get("/users", response_model=list[schemas.UserOut])
def list_users(
		q: str | None = Query(None, description="Search by name, phone or phone2"),
		db: Session = Depends(get_db),
):
	"""
	החזר את כל המשתמשים, או – אם קיים פרמטר q – בצע חיפוש על שם, טלפון או טלפון 2.
	"""
	qry = db.query(User)
	if q:
		like = f"%{q}%"
		# חיפוש לפי שם, טלפון או טלפון 2
		qry = qry.filter(
			sa.or_(
				User.name.ilike(like),
				User.phone.ilike(like),
				User.Phone2.ilike(like)
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
			try:
				crud.assign_seats(db, seat_ids, user_id)
			except ValueError as ve:
				# תפיסת השגיאה שנזרקת מ-crud.py במקרה של כיסא שכבר נתפס (Race Condition)
				raise HTTPException(status_code=400, detail=str(ve))

		# 4. בצע commit כדי לשמור את כל השינויים (גם במשתמש וגם בכיסאות)
		db.commit()
		db.refresh(user)  # רענן את אובייקט המשתמש כדי שיכיל את הנתונים המעודכנים

	except HTTPException:
		# אם זרקנו HTTPException (כמו ה-400 למעלה), אנחנו מוודאים שהטרנזקציה מבוטלת ואז זורקים הלאה
		db.rollback()
		raise
	except Exception as e:
		db.rollback()  # במקרה של שגיאה כללית, בטל את כל השינויים
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
	try:
		crud.assign_seats(db, payload["seat_ids"], payload["user_id"])
	except ValueError as ve:
		# תפיסת השגיאה מ-crud.py במקרה של התנגשות כיסאות
		raise HTTPException(status_code=400, detail=str(ve))

	return {"ok": True}


# ═════════════════════════════════════════════════════════════════════════════
#  BLESSINGS (Google Sheets)
# ═════════════════════════════════════════════════════════════════════════════
@api.post("/blessing")
def add_blessing_endpoint(data: schemas.BlessingIn):
	"""
	שמירת ברכה לזוג בגיליון Google Sheets.
	"""
	try:
		sheets.add_blessing(data.name, data.blessing)
		return {"ok": True}
	except Exception as e:
		print(f"Google Sheets Error (Blessing): {e}")
		raise HTTPException(status_code=503, detail="שגיאה מול השרתים של גוגל. אנא נסו שוב בעוד מספר דקות.")


@api.get("/blessing")
def get_blessings_endpoint():
    """
    שליפת כל הברכות מה-Google Sheets כדי להציג באתר.
    """
    try:
        return sheets.get_blessings()
    except Exception as e:
        print(f"Google Sheets Error (Get Blessings): {e}")
        # במקרה של שגיאה נחזיר רשימה ריקה כדי שהאתר לא יקרוס
        return []

# ═════════════════════════════════════════════════════════════════════════════
#  SINGLES CORNER (Google Sheets)
# ═════════════════════════════════════════════════════════════════════════════
@api.get("/singles")
def list_singles_endpoint():
	"""
	החזר רשימת רווקים/רווקות מה־Google Sheets.
	"""
	try:
		return sheets.list_singles()
	except Exception as e:
		print(f"Google Sheets Error (Get Singles): {e}")
		raise HTTPException(status_code=503, detail="לא הצלחנו לטעון את הרשימה כרגע. אנא נסו שוב מאוחר יותר.")


@api.post("/singles")
def add_single_endpoint(data: schemas.SingleIn):
	"""
	הוסף רווק/ה חדש/ה ל־Google Sheets.
	"""
	try:
		sheets.add_single(data.name, data.gender, data.about)
		return {"ok": True}
	except Exception as e:
		print(f"Google Sheets Error (Add Single): {e}")
		raise HTTPException(status_code=503, detail="שגיאה מול השרתים של גוגל. אנא נסו שוב בעוד מספר דקות.")


# ═════════════════════════════════════════════════════════════════════════════
#  FEEDBACK (Google Sheets)
# ═════════════════════════════════════════════════════════════════════════════
@api.post("/feedback")
def add_feedback_endpoint(data: schemas.FeedbackIn):
	"""
	מקבל {'name': str, 'feedback': str} ויודע להוסיף לגליון הפידבק
	"""
	try:
		sheets.add_feedback(data.name, data.feedback)
		return {"ok": True}
	except Exception as e:
		print(f"Google Sheets Error (Feedback): {e}")
		raise HTTPException(status_code=503, detail="שגיאה מול השרתים של גוגל. אנא נסו שוב בעוד מספר דקות.")


@api.post("/seats/table")
def create_table_endpoint(payload: dict, db: Session = Depends(get_db)):
	"""
	פתיחת שולחן חדש באזור ספציפי.
	מצפה ל-body בסגנון: {"area": "Hall", "capacity": 12}
	"""
	area = payload.get("area")
	capacity = payload.get("capacity", 12)
	if not area:
		raise HTTPException(status_code=400, detail="Area is required")

	new_col = crud.create_new_table(db, area, capacity)
	return {"ok": True, "new_col": new_col}


# ─────────────────────────────────────────────────────────────────────────────
#  רשום את ה-API Router תחת prefix /api
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(api)


# ─────────────────────────────────────────────────────────────────────────────
#  טיפול בנתיבים סטטיים ו-SPA Fallback
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/{catchall:path}")
def serve_react_app(catchall: str):
	"""
	תופס את כל הנתיבים שאינם /api.
	אם מדובר בקובץ אמיתי שקיים בתיקיית static (כמו תמונה, JS, CSS) - מחזיר אותו.
	אחרת (כמו ניתוב ל- /admin שרעננו את הדף עליו), מחזיר את ה-index.html של React.
	"""
	file_path = os.path.join("static", catchall)
	if os.path.isfile(file_path):
		return FileResponse(file_path)

	return FileResponse("static/index.html")