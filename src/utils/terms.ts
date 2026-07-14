import AsyncStorage from '@react-native-async-storage/async-storage';
import { TERMS_VERSION, TERMS_SYNC_ENABLED } from '../constants/legal';
import { acceptTermsRemote } from '../services/api/authService';

// Mirrors the @alopartner_cookie key pattern in session.ts.
const TERMS_KEY = '@alopartner_terms';

interface StoredTerms {
  version: string;
  acceptedAt: string;
}

/** True only if this device has accepted the *current* TERMS_VERSION. */
export async function hasAcceptedCurrentTerms(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(TERMS_KEY);
    if (!raw) return false;
    const stored: StoredTerms = JSON.parse(raw);
    return stored.version === TERMS_VERSION;
  } catch (err) {
    // Corrupt/unreadable value — safest default is "not accepted" so the
    // partner is asked again rather than silently skipped past consent.
    console.warn('[terms] hasAcceptedCurrentTerms read failed:', err);
    return false;
  }
}

/**
 * Records acceptance of the current TERMS_VERSION. Always writes locally
 * first (this is what every screen actually depends on today). If
 * TERMS_SYNC_ENABLED is on and a cookie is available, also fires a
 * best-effort remote sync — failure there never blocks the partner's flow
 * since local acceptance is already durable.
 */
export async function acceptTerms(cookie?: string): Promise<void> {
  const stored: StoredTerms = {
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(TERMS_KEY, JSON.stringify(stored));

  if (TERMS_SYNC_ENABLED && cookie) {
    try {
      await acceptTermsRemote(cookie, TERMS_VERSION);
    } catch (err) {
      console.warn('[terms] acceptTermsRemote sync failed:', err);
    }
  }
}
