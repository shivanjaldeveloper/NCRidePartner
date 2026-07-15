import { getProcessingDetails } from './onboardingService';
import { resolveProcessingStatus, ResolvedRoute } from './partnerStatus';

/**
 * VerifyOtp/VerifyCookie's ProcessingStatus stays 'NEW' at the login/session
 * level even after a partner has submitted onboarding documents —
 * OnboardingGetProcessingDetails.ProcessingStatus is the field that
 * actually advances (e.g. to an under-review state). A fresh partner and a
 * partner mid-review can both look like 'NEW' from VerifyCookie/VerifyOtp
 * alone, which wrongly sends a partner who already submitted back to Basic
 * Details. When the login-level status resolves to 'BasicDetails', double
 * check the onboarding-specific status before committing to that route.
 */
export async function refineOnboardingRoute(
  cookie: string,
  initialRoute: ResolvedRoute,
): Promise<ResolvedRoute> {
  if (initialRoute !== 'BasicDetails') return initialRoute;
  try {
    const details = await getProcessingDetails(cookie);
    if (details.Result !== 'Success') return initialRoute;
    return resolveProcessingStatus(details.ProcessingStatus);
  } catch (err) {
    // Refinement is a best-effort improvement, not a hard requirement —
    // fall back to the original (less precise) route rather than blocking
    // navigation on a second network call failing.
    console.warn('[refineOnboardingRoute] getProcessingDetails failed:', err);
    return initialRoute;
  }
}
