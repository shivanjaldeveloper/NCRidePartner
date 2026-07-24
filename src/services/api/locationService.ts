import { API_LIVE_UPDATE_BASE_URL } from './config';
import { postAuthForm } from './httpClient';

// Every field/shape below is confirmed against real curl + response
// samples for PartnerLocationUpdate, PartnerLocationHistory, and
// PartnerRideLocationHistory (all on partnerliveupdate.asmx).

export interface PartnerLocationUpdateParams {
  cookie: string;
  rideTran: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
}

export interface PartnerLocationUpdateResponse {
  Result: string;
  Message?: string;
  Error?: string;
  Cookie: string;
  RideTran: string;
  Latitude: string;
  Longitude: string;
  Accuracy: string;
  Speed: string;
  Heading: string;
  LiveTransaction: string;
  HistoryTransaction: string;
  ResponseDateTime: string;
}

/** Sends one location ping. Call this every 15-30s while the partner is online. */
export const updatePartnerLocation = (params: PartnerLocationUpdateParams) =>
  postAuthForm<PartnerLocationUpdateResponse>(
    'PartnerLocationUpdate',
    {
      cookie: params.cookie,
      rideTran: params.rideTran,
      latitude: params.latitude,
      longitude: params.longitude,
      accuracy: params.accuracy,
      speed: params.speed,
      heading: params.heading,
    },
    API_LIVE_UPDATE_BASE_URL,
  );

export interface PartnerLocationHistoryEntry {
  Cookie: string;
  RideTran: string;
  Latitude: string;
  Longitude: string;
  Accuracy: string;
  Speed: string;
  Heading: string;
  // LatestLocation uses Updated*, LocationHistory entries use Created* —
  // both confirmed present in the real response, kept optional since each
  // shape only has one pair.
  UpdatedDate?: string;
  UpdatedTime?: string;
  CreatedDate?: string;
  CreatedTime?: string;
  Transaction: string;
}

export interface PartnerLocationHistoryResponse {
  Result: string;
  Error?: string;
  Cookie: string;
  LatestLocation?: PartnerLocationHistoryEntry;
  HistoryCount: number;
  LocationHistory: PartnerLocationHistoryEntry[];
  ResponseDateTime: string;
}

/** All recent location pings for this partner, across all rides. */
export const getPartnerLocationHistory = (cookie: string) =>
  postAuthForm<PartnerLocationHistoryResponse>(
    'PartnerLocationHistory',
    { cookie },
    API_LIVE_UPDATE_BASE_URL,
  );

export interface PartnerRideLocationHistoryResponse
  extends PartnerLocationHistoryResponse {
  RideTran: string;
}

/** Same as above, but scoped to a single ride's transaction id. */
export const getPartnerRideLocationHistory = (
  cookie: string,
  rideTran: string,
) =>
  postAuthForm<PartnerRideLocationHistoryResponse>(
    'PartnerRideLocationHistory',
    { cookie, rideTran },
    API_LIVE_UPDATE_BASE_URL,
  );
