# backend/sheets_repo.py

from backend.google_sheets import open_sheet

# נסיון לפתוח את הגיליון "wedding" פעם אחת בלבד
try:
	_SPREAD = open_sheet("wedding")
	blessing_ws = _SPREAD.worksheet("ברכות")
	singles_ws  = _SPREAD.worksheet("רווקים_רווקות")
	feedback_ws = _SPREAD.worksheet("היכרויות")
except Exception as e:
	raise RuntimeError(f"❗ שגיאה בחיבור ל-Google Sheets: {e}")

# ---- ברכות ----
def add_blessing(name: str, text: str):
	"""
	מוסיף שורה חדשה לגליון 'ברכות' עם שני עמודות: name, text
	"""
	blessing_ws.append_row([name, text])

# ---- רווקים ורווקות ----
def list_singles():
	records = singles_ws.get_all_records()

	men = []
	women = []

	for row in records:
		gender = row.get("מין")
		if gender == "זכר":
			men.append({
				"name": row.get("שם", ""),
				"about": row.get("קצת עליי", "")
			})
		elif gender == "נקבה":
			women.append({
				"name": row.get("שם", ""),
				"about": row.get("קצת עליי", "")
			})

	return {
		"men": men,
		"women": women
	}

def add_single(name: str, gender: str, about: str):
	"""
	מוסיף שורה חדשה לטבלת 'רווקים_רווקות'
	עם העמודות: about, gender, name
	"""
	singles_ws.append_row([about, gender, name])

# ---- הודעות אנונימיות (פידבקים) ----
def add_feedback(name: str, feedback: str):
	"""
	מוסיף שורה חדשה לטבלת 'היכרויות' עם שני עמודות: name, feedback
	"""
	feedback_ws.append_row([name, feedback])

def add_feedback(name: str, feedback: str):
	feedback_ws.append_row([name, feedback])
