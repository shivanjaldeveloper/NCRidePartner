// Central legal config — single source of truth for Terms & Privacy.
//
// TERMS_URL / PRIVACY_URL point at hosted docs (not inline text) — update
// these to the real hosted pages before shipping.
//
// TERMS_VERSION drives re-consent: bump it any time the Terms/Privacy
// *content* changes. That's what makes an already-logged-in partner see
// TermsUpdateScreen on next launch, and what makes the Login checkbox
// start unchecked again for everyone (see utils/terms.ts).
export const TERMS_URL = 'https://ncride.example.com/partner-terms';
export const PRIVACY_URL = 'https://ncride.example.com/privacy-policy';
export const TERMS_VERSION = '1.0.0';

// Kill-switch, same pattern as this project's other feature flags (e.g.
// crypto.ts's ENCRYPTION_ENABLED). Keep this off until a real
// AcceptTerms-style endpoint exists on partnerauth.asmx — acceptance is
// always recorded locally regardless of this flag. Flip to true once
// acceptTermsRemote() in services/api/authService.ts is wired to a
// confirmed endpoint.
export const TERMS_SYNC_ENABLED = false;
