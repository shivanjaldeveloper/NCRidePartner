import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * DEMO ONLY — activates a credit window locally with no real payment or
 * backend call. This is the one function to swap for a real purchase call
 * once a billing API exists; everything else (HomeScreen, BuyCreditScreen)
 * just reads getActiveCredit()/hasActiveCredit() and won't need to change.
 */
export async function activateCreditDemo(
  planId: string,
  hours: number,
): Promise<ActiveCredit> {
  const now = Date.now();
  const expiresAt = now + hours * 60 * 60 * 1000;
  const stored: StoredCredit = { planId, hours, activatedAt: now, expiresAt };
  await AsyncStorage.setItem(CREDIT_KEY, JSON.stringify(stored));
  return { planId, hours, expiresAt, msLeft: expiresAt - now };
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
