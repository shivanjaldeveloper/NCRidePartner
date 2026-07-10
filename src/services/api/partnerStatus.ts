// Maps the `ProcessingStatus` field (confirmed on VerifyOtp + VerifyCookie
// responses) to a routing decision. Only 'NEW' has been observed in a real
// response so far — the rest (APPROVED / UNDER_REVIEW / REJECTED / BANNED
// etc.) are educated guesses based on the flow diagram, matched loosely
// via substring so small naming differences don't break routing. Send me
// a real response for an approved/under-review/rejected partner and I'll
// replace the guesswork with exact matches.
export type ResolvedRoute = 'Home' | 'BasicDetails' | 'Processing' | 'Blocked';

export function resolveProcessingStatus(status?: string): ResolvedRoute {
  const s = (status || '').toUpperCase();

  if (s === 'NEW') {
    // Confirmed value: brand-new partner — send into onboarding
    // (Basic Details -> Partner Documents), per the flow diagram.
    return 'BasicDetails';
  }
  if (s.includes('APPROV') || s.includes('ALLOW')) return 'Home';
  if (s.includes('REVIEW') || s.includes('PENDING') || s.includes('PROCESS'))
    return 'Processing';
  if (s.includes('REJECT') || s.includes('BAN') || s.includes('BLOCK'))
    return 'Blocked';

  // Unrecognized status — safest default is to send them into onboarding
  // rather than silently letting them into Home.
  return 'BasicDetails';
}
