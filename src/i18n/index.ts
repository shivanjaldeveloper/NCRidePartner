import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { type LanguageDetectorAsyncModule } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type LanguageCode,
} from './languages';

// Same AsyncStorage-backed-persistence pattern as session.ts / onboarding.ts —
// a single dedicated key, read/written directly, no extra native deps.
// Matches the @alopartner_ prefix used everywhere else in this app
// (session.ts's @alopartner_cookie, onboarding.ts's @alopartner_onboarding_seen).
export const LANGUAGE_STORAGE_KEY = '@alopartner_language';

// react-native's core NativeModules (no extra native linking needed, unlike
// react-native-localize) expose the device locale differently per platform.
const getDeviceLanguageCode = (): string => {
  try {
    const locale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    return String(locale || DEFAULT_LANGUAGE)
      .split(/[-_]/)[0]
      .toLowerCase();
  } catch (err) {
    console.warn('[i18n] Could not read device locale:', err);
    return DEFAULT_LANGUAGE;
  }
};

// Resolution order: partner's explicit in-app choice (AsyncStorage) →
// device locale (if we support it) → English.
const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async (callback: (lng: string) => void) => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && isSupportedLanguage(saved)) {
        callback(saved);
        return;
      }
    } catch (err) {
      console.warn('[i18n] Failed to read saved language:', err);
    }

    const device = getDeviceLanguageCode();
    callback(isSupportedLanguage(device) ? device : DEFAULT_LANGUAGE);
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (err) {
      console.warn('[i18n] Failed to persist language:', err);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'hi', 'mr'],
    interpolation: {
      // React already escapes output — double-escaping breaks the
      // Devanagari punctuation/quotes used in the hi/mr strings.
      escapeValue: false,
    },
    react: {
      // No Suspense boundary set up anywhere in this app's navigation tree,
      // so keep language changes as plain re-renders via useTranslation.
      useSuspense: false,
    },
    // RN has no event loop tick the way browsers do — this makes init()
    // finish synchronously with the fallback language instead of queuing
    // via setTimeout, so the very first frame isn't unstyled/untranslated.
    initImmediate: false,
    // Guards against Hermes builds without full ICU (missing
    // Intl.PluralRules) mis-handling plural/interpolation edge cases.
    compatibilityJSON: 'v3',
  });

// Call this from anywhere (e.g. the Settings language sheet) to switch
// language app-wide and persist the choice for next launch.
export const changeAppLanguage = (lng: LanguageCode) =>
  i18n.changeLanguage(lng);

export default i18n;
