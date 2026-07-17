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
