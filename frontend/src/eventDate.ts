// src/config/eventDate.ts

/**
 * הפורמט שבו נתון התאריך: "DD.MM.YY"
 * לדוגמה: "16.10.25" עבור 16 באוקטובר 2025.
 */
export const EVENT_DATE_STRING = "16.10.25";

/**
 * parseDateString: ממיר מחרוזת בתבנית "DD.MM.YY" לאובייקט Date.
 * החוקים:
 *  - אם YY < 70 => שנת 2000+YY (למשל: "25" => 2025)
 *  - אם YY >= 70 => שנת 1900+YY (למשל: "75" => 1975)
 *  - מחזיר null במקרה של פורמט לא תקין או ערכי תאריך לא הגיוניים.
 */
const parseDateString = (dateString: string): Date | null => {
    // בדיקה בסיסית של הפורמט: יום (1-2 ספרות), נקודה, חודש (1-2 ספרות), נקודה, שנת 2 ספרות
    if (!/^\d{1,2}\.\d{1,2}\.\d{2}$/.test(dateString)) {
        console.error("📅 parseDateString: פורמט תאריך לא תקין. יש להשתמש ב- DD.MM.YY");
        return null;
    }

    const parts = dateString.split(".");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // החודש כפי שהמשתמש מכניס (1-12)
    const yearShort = parseInt(parts[2], 10);

    // קביעת השנה המלאה לפי חוק:
    //  - 00..69 => 2000..2069
    //  - 70..99 => 1970..1999
    const year = yearShort < 70 ? 2000 + yearShort : 1900 + yearShort;

    // בוני Date מצפה לחודש מבוסס 0 (0=ינואר,...,11=דצמבר)
    const dateObject = new Date(year, month - 1, day);

    // וידוא שהתאריך שנוצר אכן תואם את הערכים שהוזנו (למשל: יום 32 בחודש לא יתאים)
    if (
        isNaN(dateObject.getTime()) ||
        dateObject.getFullYear() !== year ||
        dateObject.getMonth() !== month - 1 ||
        dateObject.getDate() !== day
    ) {
        console.error("📅 parseDateString: ערכי התאריך שהוזנו אינם תקינים (למשל, יום 32 בחודש).");
        return null;
    }

    return dateObject;
};

/**
 * EVENT_DATE: אובייקט Date מוכן לשימוש בקומפוננטות, שמבוסס על ה- EVENT_DATE_STRING.
 * אם parse נכשל (מהלך בלתי צפוי), ייחזר כברירת מחדל ל־new Date() של היום.
 */
export const EVENT_DATE: Date = parseDateString(EVENT_DATE_STRING) || new Date();

/**
 * אם תרצו לקבל את המחרוזת ללא המרה, תוכלו להשתמש גם ב- EVENT_DATE_STRING.
 * למשל: להדפיס בטקסט משהו כמו "התאריך הוא: 16.10.25".
 */

export default {
    EVENT_DATE_STRING,
    EVENT_DATE,
};