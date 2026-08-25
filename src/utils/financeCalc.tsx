import { RideHistoryItem } from '../services/api/ridesService';
import { PartnerPlanHistoryItem } from '../services/api/plansService';

// Single source of truth for "Income / Expense / Earnings" everywhere in
// the app (currently HomeScreen's Today card + EarningsScreen's
// Today/Week/Month tabs). Definition, per spec:
//   Income   = sum of FinalFare across the ride list (GetRideHistory) —
//              nothing else added or subtracted.
//   Expense  = sum of PlanRate across the plan purchase history
//              (PartnerPlanHistory).
//   Earnings = Income − Expense.

/**
 * Parses "DD-MM-YYYY" + "HH:mm:ss" (the format both GetRideHistory and
 * PartnerPlanHistory use for their date/time fields — confirmed for plans
 * in utils/credit.ts; rides follow the same convention throughout this
 * codebase, e.g. TripHistoryScreen renders them as-is). Time is optional —
 * missing/unparseable time falls back to midnight rather than failing the
 * whole parse, since we only need date-level precision for range bucketing.
 * Returns null on any unexpected shape instead of throwing.
 */
export function parseDdMmYyyyHms(date?: string, time?: string): number | null {
  if (!date) return null;
  const [d, m, y] = date.split('-').map(Number);
  if (![d, m, y].every(n => Number.isFinite(n))) return null;

  let hh = 0;
  let mm = 0;
  let ss = 0;
  if (time) {
    const parts = time.split(':').map(Number);
    hh = Number.isFinite(parts[0]) ? parts[0] : 0;
    mm = Number.isFinite(parts[1]) ? parts[1] : 0;
    ss = Number.isFinite(parts[2]) ? parts[2] : 0;
  }

  const dt = new Date(y, (m || 1) - 1, d || 1, hh, mm, ss);
  const ms = dt.getTime();
  return Number.isFinite(ms) ? ms : null;
}

export interface DateRange {
  start: number; // inclusive, epoch ms
  end: number; // inclusive, epoch ms
}

/** Midnight today → 23:59:59.999 today, in local time. */
export function todayRange(now: number = Date.now()): DateRange {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

/** Monday 00:00 → Sunday 23:59:59.999 of the current week, local time. */
export function weekRange(now: number = Date.now()): DateRange {
  const d = new Date(now);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - diffToMonday,
  );
  const start = monday.getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

/** 1st of the current month 00:00 → last instant of the month, local time. */
export function monthRange(now: number = Date.now()): DateRange {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1;
  return { start, end };
}

function inRange(ms: number | null, range: DateRange): boolean {
  return ms !== null && ms >= range.start && ms <= range.end;
}

function toNumber(v?: string | number): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function ridesInRange(
  rides: RideHistoryItem[],
  range: DateRange,
): RideHistoryItem[] {
  return rides.filter(r =>
    inRange(parseDdMmYyyyHms(r.CreatedDate, r.CreatedTime), range),
  );
}

export function planHistoryInRange(
  history: PartnerPlanHistoryItem[],
  range: DateRange,
): PartnerPlanHistoryItem[] {
  return history.filter(p =>
    inRange(parseDdMmYyyyHms(p.PlanStartDate, p.PlanStartTime), range),
  );
}

/** Income = sum of FinalFare across the given rides. Nothing else. */
export function sumRideIncome(rides: RideHistoryItem[]): number {
  return rides.reduce((sum, r) => sum + toNumber(r.FinalFare), 0);
}

/** Expense = sum of PlanRate across the given plan-purchase history. */
export function sumPlanExpense(history: PartnerPlanHistoryItem[]): number {
  return history.reduce((sum, p) => sum + toNumber(p.PlanRate), 0);
}

export interface FinancialSummary {
  income: number;
  expense: number;
  earnings: number;
  tripCount: number;
}

/**
 * Buckets rides + plan history into a date range and reduces them to the
 * Income/Expense/Earnings triple. This is the one function both
 * HomeScreen (today only) and EarningsScreen (today/week/month tabs)
 * should call — keeps the definition identical everywhere.
 */
export function summarize(
  rides: RideHistoryItem[],
  planHistory: PartnerPlanHistoryItem[],
  range: DateRange,
): FinancialSummary {
  const ridesR = ridesInRange(rides, range);
  const plansR = planHistoryInRange(planHistory, range);
  const income = sumRideIncome(ridesR);
  const expense = sumPlanExpense(plansR);
  return {
    income,
    expense,
    earnings: income - expense,
    tripCount: ridesR.length,
  };
}
