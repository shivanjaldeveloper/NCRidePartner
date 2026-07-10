// Maps the `ProcessingStatus` field (confirmed on VerifyOtp + VerifyCookie
// responses) to a routing decision. Only 'NEW' has been observed in a real
// response so far — the rest (APPROVED / UNDER_REVIEW / REJECTED / BANNED
// etc.) are educated guesses based on the flow diagram, matched loosely
// via substring so small naming differences don't break routing. Send me
// a real response for an approved/under-review/banned partner and I'll
// replace the guesswork with exact matches.
export type ResolvedRoute = 'Home' | 'Verification' | 'Permissions' | 'Blocked';

export function resolveProcessingStatus(status?: string): ResolvedRoute {
  const s = (status || '').toUpperCase();

  if (s === 'NEW') {
    // Confirmed value: brand-new partner, onboarding required.
    // Basic Details / Documents screens aren't built yet — Permissions
    // is the closest existing next step in the app right now.
    return 'Permissions';
  }
  if (s.includes('APPROV') || s.includes('ALLOW')) return 'Home';
  if (s.includes('REVIEW') || s.includes('PENDING') || s.includes('PROCESS'))
    return 'Verification';
  if (s.includes('REJECT') || s.includes('BAN') || s.includes('BLOCK'))
    return 'Blocked';

  // Unrecognized status — safest default is to treat it like a fresh
  // partner rather than silently letting them into Home.
  return 'Permissions';
}
