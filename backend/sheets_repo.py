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


def get_blessings():
	"""
	שולף את כל הברכות מהגיליון 'ברכות'.
	"""
	try:
		# get_all_records קורא את כל השורות כשהשורה הראשונה משמשת כמפתחות (Headers)
		records = blessing_ws.get_all_records()

		formatted_blessings = []
		for row in records:
			# מנסה לשלוף לפי כותרות אפשריות (במידה וקראת לעמודות "שם" ו-"ברכה" או באנגלית)
			name = row.get("שם", row.get("name", row.get("Name", "")))
			blessing_text = row.get("ברכה", row.get("text", row.get("blessing", "")))

			# נוסיף רק אם יש באמת תוכן
			if name or blessing_text:
				formatted_blessings.append({
					"name": str(name),
					"blessing": str(blessing_text)
				})

		# מחזירים את הרשימה הפוך, כדי שהברכות החדשות ביותר יופיעו ראשונות
		return formatted_blessings[::-1]
	except Exception as e:
		print(f"Error getting blessings: {e}")
		return []


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