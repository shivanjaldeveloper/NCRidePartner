// Single source of truth for which languages the app supports.
// Add a new language by: 1) adding it here, 2) adding its locale file in
// ./locales, 3) registering it in ./index.ts resources.

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  // Shown in the language's own script, regardless of the app's current
  // language — this is how every major app lists language choices.
  nativeLabel: string;
  englishLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { code: 'hi', nativeLabel: 'हिन्दी', englishLabel: 'Hindi' },
  { code: 'mr', nativeLabel: 'मराठी', englishLabel: 'Marathi' },
];

export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = LANGUAGES.map(
  l => l.code,
);

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const isSupportedLanguage = (code: string): code is LanguageCode =>
  (SUPPORTED_LANGUAGE_CODES as string[]).includes(code);

export const getLanguageOption = (code: string): LanguageOption =>
  LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
