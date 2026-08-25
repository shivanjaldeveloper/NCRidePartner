// Central config for the aloapp.shop partner APIs.
// API_BEARER_TOKEN comes from .env (see .env.example) — it must never be
// hardcoded here or committed to git. See react-native-dotenv setup notes
// in the project README / .env.example.
import { API_BEARER_TOKEN as ENV_API_BEARER_TOKEN } from '@env';

export const API_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partnerauth.asmx';

// Plans live under a separate .asmx service (partnerplans, not partnerauth) —
// same host/token, different WebMethod base. Confirmed via the
// PartnerPlanList curl sample.
export const API_PLANS_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partnerplans.asmx';

// Live location tracking (update / history / ride-history) — same host and
// token, separate .asmx service. Confirmed via the PartnerLocationUpdate /
// PartnerLocationHistory / PartnerRideLocationHistory curl samples.
export const API_LIVE_UPDATE_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partnerliveupdate.asmx';

// Razorpay order create/verify — confirmed via the VerifyPartnerPlanPayment
// curl sample (partnerpayments.asmx). CreatePartnerPlanOrder's exact path
// isn't confirmed by a real curl yet, but it's assumed to live on the same
// .asmx service as Verify — see the banner in partnerPaymentsService.ts.
export const API_PAYMENTS_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partnerpayments.asmx';

// Pending ride offers (GetPendingRides) — same host/token, separate .asmx
// service. Confirmed via the GetPendingRides curl + response samples.
export const API_RIDE_REQUEST_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partner-riderequest.asmx';

// Home dashboard summary (PartnerHome) — same host/token, separate .asmx
// service. Confirmed via the PartnerHome curl + response sample.
export const API_HOME_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partner-home.asmx';

export const API_BEARER_TOKEN = ENV_API_BEARER_TOKEN;
