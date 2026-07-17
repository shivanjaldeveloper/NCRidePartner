// Central config for the aloapp.shop partner APIs.
// The bearer token below is the static app-level token from your curl
// samples — if this is meant to be per-environment (dev/staging/prod),
// move it into an env file (e.g. react-native-config) instead of hardcoding.
export const API_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partnerauth.asmx';

// Plans live under a separate .asmx service (partnerplans, not partnerauth) —
// same host/token, different WebMethod base. Confirmed via the
// PartnerPlanList curl sample.
export const API_PLANS_BASE_URL =
  'https://aloapp.shop/apiv1/partner/partnerplans.asmx';

export const API_BEARER_TOKEN = 'LrhTJugsRqEnefmaykA4wKNY';
