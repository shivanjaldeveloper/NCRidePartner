import { API_HOME_BASE_URL } from './config';
import { postAuthForm } from './httpClient';

// Confirmed via real curl + response against partner-home.asmx/PartnerHome.
// This is the source of truth for the Today/This week/This month stat
// blocks (Earnings, TripsCompleted, OnlineMinutes, Rating) — HomeScreen and
// EarningsScreen should read those instead of deriving them locally from
// GetRideHistory + PartnerPlanHistory, since this endpoint already gives
// the server's own numbers (including OnlineMinutes/Rating, which nothing
// else exposes). Income/Expense split still comes from financeCalc.ts —
// this response only has the net Earnings figure per period.
export interface PartnerHomeStatsBlock {
  Earnings: string;
  TripsCompleted: number;
  OnlineMinutes: number;
  OnlineDurationText: string;
  Rating: string;
  [key: string]: any;
}

export interface PartnerHomeCreditActive {
  Active: 'YES' | 'NO' | string;
  PlanName?: string;
  PlanStartDate?: string;
  PlanStartTime?: string;
  PlanEndDate?: string;
  PlanEndTime?: string;
  TotalMinutesLeft?: number;
  TotalSecondsLeft?: number;
  TimeLeftText?: string;
  [key: string]: any;
}

export interface PartnerHomeHotZone {
  AreaName: string;
  Latitude: string;
  Longitude: string;
  RadiusKM: string;
  RecentRequestCount: number;
  LookbackHours: number;
  DemandLevel: string;
  DistanceKM: string;
  WithinZone: 'YES' | 'NO' | string;
  [key: string]: any;
}

export interface PartnerHomeActiveVehicle {
  VehicleAvailable: 'YES' | 'NO' | string;
  VehicleType?: string;
  VehicleModel?: string;
  VehicleRegistration?: string;
  Verified?: 'YES' | 'NO' | string;
  [key: string]: any;
}

export interface PartnerHomeResponse {
  Result: 'Success' | string;
  Message?: string;
  Name?: string;
  OnOff?: 'ON' | 'OFF' | string;
  CreditActive?: PartnerHomeCreditActive;
  Today?: PartnerHomeStatsBlock;
  ThisWeek?: PartnerHomeStatsBlock;
  ThisMonth?: PartnerHomeStatsBlock;
  HotZones?: PartnerHomeHotZone[];
  ActiveVehicle?: PartnerHomeActiveVehicle;
  ResponseDateTime?: string;
  [key: string]: any;
}

export const getPartnerHome = (cookie: string) =>
  postAuthForm<PartnerHomeResponse>(
    'PartnerHome',
    { cookie },
    API_HOME_BASE_URL,
  );
