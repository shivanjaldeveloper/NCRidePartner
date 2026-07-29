import { API_PLANS_BASE_URL } from './config';
import { postAuthForm } from './httpClient';

// Confirmed via real curl + response against partnerplans.asmx/PartnerPlanList.
// Note the field names: PlanRate is the total plan price (not an hourly
// rate) and PlanTime is plan duration in hours — the UI derives ₹/hr itself.
export interface PartnerPlan {
  Region: string;
  PlanName: string;
  PlanRate: string;
  PlanTime: string;
  PlanRideCount: string;
  PlanTransaction: string;
  [key: string]: any;
}

export interface PartnerPlanListResponse {
  Result: 'Success' | string;
  Message?: string;
  PlanCount?: number;
  Plans?: PartnerPlan[];
  ResponseDateTime?: string;
  [key: string]: any;
}

export const getPartnerPlanList = (cookie: string) =>
  postAuthForm<PartnerPlanListResponse>(
    'PartnerPlanList',
    { cookie },
    API_PLANS_BASE_URL,
  );

// ── Partner ON/OFF (go online / go offline toggle) ─────────────────────────
// Confirmed via real curl + response against partnerplans.asmx.

export type OnOffState = 'ON' | 'OFF';

export interface PartnerOnOffResponse {
  Result: 'Success' | string;
  Message?: string;
  OnOff?: OnOffState;
  ResponseDateTime?: string;
  [key: string]: any;
}

export const getPartnerOnOffStatus = (cookie: string) =>
  postAuthForm<PartnerOnOffResponse>(
    'PartnerOnOffGet',
    { cookie },
    API_PLANS_BASE_URL,
  );

export const setPartnerOnOffStatus = (cookie: string, onOff: OnOffState) =>
  postAuthForm<PartnerOnOffResponse>(
    'PartnerOnOffUpdate',
    { cookie, onOff },
    API_PLANS_BASE_URL,
  );

// ── Active plan check ───────────────────────────────────────────────────
// Confirmed via real curl + response, but only for the "no active plan"
// case (`PlanAvailable: "NO"`). The exact field names returned when
// `PlanAvailable` is "YES" (e.g. what the plan-end timestamp field is
// called) haven't been confirmed against a real response yet — send me
// one and I'll tighten getActiveCreditFromServer() in utils/credit.ts to
// match exactly instead of the defensive multi-field-name guessing it
// does today.
export interface PartnerActivePlanResponse {
  Result: 'Success' | string;
  Message?: string;
  PlanAvailable: 'YES' | 'NO' | string;
  PlanTran?: string;
  PlanName?: string;
  PlanEndDate?: string; // guessed field name, format "DD-MM-YYYY" (unconfirmed)
  PlanEndTime?: string; // guessed field name, format "HH:mm:ss" (unconfirmed)
  PlanRideCount?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

export const getPartnerActivePlan = (cookie: string) =>
  postAuthForm<PartnerActivePlanResponse>(
    'PartnerActivePlan',
    { cookie },
    API_PLANS_BASE_URL,
  );

// ── Plan purchase history ──────────────────────────────────────────────
// Confirmed via real curl + response.
export interface PartnerPlanHistoryItem {
  PlanStartDate: string;
  PlanStartTime: string;
  PlanEndDate: string;
  PlanEndTime: string;
  PlanTran: string;
  PlanName: string;
  PlanRate: string;
  PlanRideCount: string;
  UpdatedDate: string;
  UpdatedTime: string;
  Transaction: string;
  PaymentTran: string;
  [key: string]: any;
}

export interface PartnerPlanHistoryResponse {
  Result: 'Success' | string;
  Message?: string;
  HistoryCount?: string | number;
  History?: PartnerPlanHistoryItem[];
  ResponseDateTime?: string;
  [key: string]: any;
}

export const getPartnerPlanHistory = (cookie: string) =>
  postAuthForm<PartnerPlanHistoryResponse>(
    'PartnerPlanHistory',
    { cookie },
    API_PLANS_BASE_URL,
  );
