/**
 * Which season it is, in Belgium, for the ASCII backdrop pools.
 *
 * Meteorological seasons (lente Mar–May, zomer Jun–Aug, herfst Sep–Nov,
 * winter Dec–Feb), decided on the date in Europe/Brussels regardless of
 * where the visitor is (owner's decision, 2026-10-20). Pure functions, no
 * DOM, so they run at build time, in the browser and in the test suite.
 */

export type Season = 'lente' | 'zomer' | 'herfst' | 'winter';

export const SEASON_TIME_ZONE = 'Europe/Brussels';

/** The calendar month (1–12) of `date` in `timeZone`. */
export function monthIn(date: Date, timeZone: string = SEASON_TIME_ZONE): number {
  const month = new Intl.DateTimeFormat('en-US', { timeZone, month: 'numeric' }).format(date);
  return Number(month);
}

/** The meteorological season a month (1–12) belongs to. */
export function seasonForMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'lente';
  if (month >= 6 && month <= 8) return 'zomer';
  if (month >= 9 && month <= 11) return 'herfst';
  return 'winter';
}

/** The season at `date` (now by default) in Belgium. */
export function seasonFor(date: Date = new Date(), timeZone: string = SEASON_TIME_ZONE): Season {
  return seasonForMonth(monthIn(date, timeZone));
}
