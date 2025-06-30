// src/config/eventD.ts
/**
 * פורמט קלט: "DD.MM.YY"  →  16.10.25
 */

export interface ScheduleItem {
  time: string;
  label: string;
}


export const EVENT_DATE_STRING = "30.10.25";

export const venue = {
  name: "אולמי אודיאסה",
  address: "הנרייטה סולד 4, באר שבע",
};

export const eventSchedule: ScheduleItem[] = [
  { time: "18:00", label: "כיסא כלה" },
  { time: "18:30", label: "קבלת פנים" },
  { time: "19:00", label: "חופה וקידושין" },
];



/**
 ----------------------------------------------------------------------
 */





export const parseDateString = (s: string): Date | null => {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/.exec(s);
  if (!m) return null;

  const [day, month, yy] = m.slice(1).map(Number);

  // ולידציית טווחים בסיסית
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const fullYear = yy < 70 ? 2000 + yy : 1900 + yy;

  // לבנות ב-UTC בשעה 12:00 – מונע קפיצות DST
  const date = new Date(Date.UTC(fullYear, month - 1, day, 12));

  // ולידציה סופית (לוכדת 31/2 וכד׳)
  if (
    date.getUTCFullYear() !== fullYear ||
    date.getUTCMonth()   !== month - 1 ||
    date.getUTCDate()    !== day
  ) return null;

  return date;
};


export const EVENT_DATE: Date = parseDateString(EVENT_DATE_STRING) ?? new Date();