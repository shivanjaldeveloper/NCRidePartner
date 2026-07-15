import AsyncStorage from '@react-native-async-storage/async-storage';

// Mirrors the @alopartner_cookie / @alopartner_terms key pattern in
// session.ts / terms.ts. Deliberately a SEPARATE key from the cookie —
// logout only clears @alopartner_cookie, so this flag survives logout and
// only ever gets wiped by an actual uninstall/reinstall (which clears all
// AsyncStorage) or the device being fresh. That's what makes onboarding
// "first install only" instead of "every time there's no cookie".
const ONBOARDING_SEEN_KEY = '@alopartner_onboarding_seen';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === '1';
  } catch (err) {
    // Unreadable storage — safer to show onboarding once more than to
    // risk skipping it for a genuinely new install.
    console.warn('[onboarding] hasSeenOnboarding read failed:', err);
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch (err) {
    console.warn('[onboarding] markOnboardingSeen write failed:', err);
  }
}
