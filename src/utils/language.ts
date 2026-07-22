import AsyncStorage from '@react-native-async-storage/async-storage';

// Deliberately a SEPARATE key from i18n's LANGUAGE_STORAGE_KEY
// (src/i18n/index.ts). That key gets written automatically the moment
// i18next resolves ANY language — including the very first auto-detected
// device-locale guess, before the partner has ever seen or touched the
// language screen. This flag only gets set from one place: the partner
// tapping "Continue" on LanguageSelectScreen. That's what lets Splash
// reliably tell "never chosen, show the picker" apart from "already has
// a language, either picked or auto-detected on a prior launch".
const LANGUAGE_CHOSEN_KEY = '@alopartner_language_chosen';

export async function hasChosenLanguage(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LANGUAGE_CHOSEN_KEY)) === '1';
  } catch (err) {
    // Unreadable storage — safer to show the picker once more than to
    // risk skipping it for a genuinely new install.
    console.warn('[language] hasChosenLanguage read failed:', err);
    return false;
  }
}

export async function markLanguageChosen(): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_CHOSEN_KEY, '1');
  } catch (err) {
    console.warn('[language] markLanguageChosen write failed:', err);
  }
}
