// ────────────────────────────────────────────────────────────────────────
// Real Razorpay order-create / verify flow against partnerpayments.asmx.
// Replaces razorpayOrderService.ts (createRazorpayOrder_DEV_ONLY), which
// hit api.razorpay.com directly from the app using the key SECRET — never
// safe to ship. This file is server-driven end to end:
//   1) createPartnerPlanOrder   -> server creates the Razorpay order,
//      returns the order details Checkout needs. The public key itself
//      is NOT part of this response (confirmed via real curl) — it's a
//      public, non-secret value so it's fine to keep it in
//      constants/razorpay.ts and pass it alongside the order details.
//   2) Razorpay Checkout runs entirely on-device (no server call).
//   3) verifyPartnerPlanPayment -> server recomputes the HMAC signature
//      with the key SECRET and confirms the payment. Only a "Success"
//      here means the credit should actually be activated.
// ────────────────────────────────────────────────────────────────────────
import { API_PAYMENTS_BASE_URL } from './config';
import { postAuthForm } from './httpClient';

export interface CreatePartnerPlanOrderResponse {
  Result: 'Success' | string;
  Message?: string;
  Mode?: string;
  RazorpayOrderId: string;
  AmountPaise: number;
  Currency: string;
  PlanName?: string;
  PlanRegion?: string;
  PlanAmount?: string;
  PlanHour?: string;
  PlanRideCount?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

/**
 * Step 1 of the plan-purchase flow. Confirmed via real curl + response.
 * Stop and surface an error if `Result !== 'Success'` — do not open
 * Razorpay Checkout in that case.
 */
export const createPartnerPlanOrder = (cookie: string, plantran: string) =>
  postAuthForm<CreatePartnerPlanOrderResponse>(
    'CreatePartnerPlanOrder',
    { cookie, plantran },
    API_PAYMENTS_BASE_URL,
  );

export interface VerifyPartnerPlanPaymentResponse {
  Result: 'Success' | string;
  Message?: string;
  Mode?: string;
  RazorpayOrderId?: string;
  AmountPaise?: number;
  Currency?: string;
  PlanName?: string;
  PlanRegion?: string;
  PlanAmount?: string;
  PlanHour?: string;
  PlanRideCount?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

/**
 * Step 3 of the plan-purchase flow. Confirmed via real curl + response.
 * Only show the success screen / activate credit when this returns
 * `Result === 'Success'`.
 */
export const verifyPartnerPlanPayment = (
  cookie: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) =>
  postAuthForm<VerifyPartnerPlanPaymentResponse>(
    'VerifyPartnerPlanPayment',
    { cookie, razorpayOrderId, razorpayPaymentId, razorpaySignature },
    API_PAYMENTS_BASE_URL,
  );
