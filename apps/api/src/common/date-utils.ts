function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Today's calendar date (in the server's local timezone) as a UTC-midnight Date, matching how date-only values are stored. */
export function utcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Strips the time component of a stored date-only value, keeping its UTC calendar date. */
export function utcDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addUTCMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

export function addUTCDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

export function utcMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

export function utcYearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  return { start, end };
}

export function utcMondayOf(date: Date) {
  const d = utcDateOnly(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addUTCDays(d, diff);
}

export function dayKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function yearKey(date: Date) {
  return `${date.getUTCFullYear()}`;
}

/** Difference in whole days between two UTC-midnight dates (b - a). */
export function daysBetweenUTC(a: Date, b: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}
