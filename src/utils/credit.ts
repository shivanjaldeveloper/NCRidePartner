import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPartnerActivePlan } from '../services/api/plansService';

// Mirrors the @alopartner_cookie / @alopartner_terms key pattern in
// session.ts / terms.ts.
const CREDIT_KEY = '@alopartner_credit';

interface StoredCredit {
  planId: string;
  hours: number;
  activatedAt: number; // epoch ms
  expiresAt: number; // epoch ms
}

export interface ActiveCredit {
  planId: string;
  hours: number;
  expiresAt: number;
  msLeft: number;
}

async function readCredit(): Promise<StoredCredit | null> {
  try {
    const raw = await AsyncStorage.getItem(CREDIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCredit;
  } catch (err) {
    console.warn('[credit] read failed:', err);
    return null;
  }
}

/**
 * Returns the active credit window if one exists and hasn't expired, else
 * null. Expired credit is cleared as a side effect so stale data doesn't
 * linger in storage or get read as "active" next time.
 */
export async function getActiveCredit(): Promise<ActiveCredit | null> {
  const stored = await readCredit();
  if (!stored) return null;

  const msLeft = stored.expiresAt - Date.now();
  if (msLeft <= 0) {
    await AsyncStorage.removeItem(CREDIT_KEY);
    return null;
  }
  return {
    planId: stored.planId,
    hours: stored.hours,
    expiresAt: stored.expiresAt,
    msLeft,
  };
}

export async function hasActiveCredit(): Promise<boolean> {
  return (await getActiveCredit()) !== null;
}

/**
 * Activates a credit window locally right after PaymentScreen gets
 * `Result: 'Success'` back from VerifyPartnerPlanPayment — `hours` comes
 * from that response's `PlanHour` field, not user input, so this is real
 * (server-verified) activation, not a demo stub. HomeScreen/BuyCreditScreen
 * just keep reading getActiveCredit()/hasActiveCredit() and don't change.
 */
export async function activateCredit(
  planId: string,
  hours: number,
): Promise<ActiveCredit> {
  const now = Date.now();
  const expiresAt = now + hours * 60 * 60 * 1000;
  const stored: StoredCredit = { planId, hours, activatedAt: now, expiresAt };
  await AsyncStorage.setItem(CREDIT_KEY, JSON.stringify(stored));
  return { planId, hours, expiresAt, msLeft: expiresAt - now };
}

/**
 * Parses "DD-MM-YYYY" + "HH:mm:ss" (the format PartnerPlanHistory's
 * date/time fields use) into an epoch-ms timestamp. Returns null on any
 * unexpected shape instead of throwing, since this is only ever a
 * best-effort reconciliation.
 */
function parseDdMmYyyyHms(date?: string, time?: string): number | null {
  if (!date || !time) return null;
  const [d, m, y] = date.split('-').map(Number);
  const [hh, mm, ss] = time.split(':').map(Number);
  if (![d, m, y, hh, mm].every(n => Number.isFinite(n))) return null;
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  const ms = dt.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Reconciles local credit state with the server via PartnerActivePlan —
 * call this alongside getActiveCredit() on Home/BuyCredit focus so a plan
 * that expired or was changed server-side (different device, admin
 * action, etc.) doesn't keep showing as active from stale local storage.
 *
 * NOTE: the exact field names PartnerActivePlan returns when
 * `PlanAvailable === 'YES'` aren't confirmed by a real response yet (see
 * plansService.ts). This defensively tries a couple of plausible field
 * names for the plan-end timestamp and falls back to trusting whatever's
 * already in local storage if none match — so nothing breaks once a real
 * "YES" response comes back looking different than assumed, it just won't
 * be as precise until the field names are confirmed.
 *
 * Network/API failures are swallowed and fall back to local storage only,
 * same "best effort, don't block on it" pattern used for the profile
 * lookup in PaymentScreen.
 */
export async function refreshActiveCreditFromServer(
  cookie: string | null,
): Promise<ActiveCredit | null> {
  if (!cookie) return getActiveCredit();

  try {
    const res: any = await getPartnerActivePlan(cookie);
    if (res.Result !== 'Success') return getActiveCredit();

    if (res.PlanAvailable === 'NO') {
      // Server says no active plan — clear any stale local record so we
      // don't keep showing "credit active" from an old cached window.
      await AsyncStorage.removeItem(CREDIT_KEY);
      return null;
    }

    if (res.PlanAvailable === 'YES') {
      const planId = res.PlanTran || res.PlanTransaction || '';
      const endMs =
        parseDdMmYyyyHms(res.PlanEndDate, res.PlanEndTime) ??
        parseDdMmYyyyHms(res.EndDate, res.EndTime) ??
        parseDdMmYyyyHms(res.ExpiryDate, res.ExpiryTime);

      if (endMs) {
        const msLeft = endMs - Date.now();
        if (msLeft <= 0) {
          await AsyncStorage.removeItem(CREDIT_KEY);
          return null;
        }
        return { planId, hours: 0, expiresAt: endMs, msLeft };
      }

      // Couldn't parse a server-side expiry — trust local storage if we
      // have one (e.g. just activated it ourselves), otherwise fall back
      // to a locally-tracked "active" state.
      const local = await getActiveCredit();
      if (local) return local;
    }

    return getActiveCredit();
  } catch (err) {
    console.warn('[credit] refreshActiveCreditFromServer failed:', err);
    return getActiveCredit();
  }
}

/** Formats ms remaining as "5h 42m left" / "42m left" / "Expired". */
export function formatTimeLeft(msLeft: number): string {
  if (msLeft <= 0) return 'Expired';
  const totalMinutes = Math.floor(msLeft / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m left`;
  if (minutes === 0) return `${hours}h left`;
  return `${hours}h ${minutes}m left`;
}
