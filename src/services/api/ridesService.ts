import { API_RIDE_REQUEST_BASE_URL } from './config';
import { postAuthForm } from './httpClient';

// Every field below is confirmed against the real curl + response samples
// for GetPendingRides (partner-riderequest.asmx).

export interface RidePoint {
  Latitude: string;
  Longitude: string;
  Address: string;
}

export interface RideRoute {
  EncodedPolyline: string;
  PolylineColor: string;
  PolylineWidth: string;
}

export interface PendingRide {
  RideTran: string;
  VehicleType: string;
  Pickup: RidePoint;
  Drop: RidePoint;
  Route: RideRoute;
  TripDistanceKM: string;
  TripDurationMinutes: string;
  EstimatedFare: string;
  EstimatedFareText: string;
  DistanceToPickupKM: string;
  ETAToPickupMinutes: string;
  // Confirmed via a real AcceptRide sample response: flat fields, not
  // nested under a "Customer" object. Not yet confirmed whether
  // GetPendingRides also sends these pre-accept (plausibly withheld
  // there for privacy) — both optional either way, screens fall back to
  // a generic "Passenger" label when absent rather than a fake name.
  CustomerName?: string;
  CustomerMobile?: string;
}

export interface GetPendingRidesResponse {
  Result: string;
  Message?: string;
  Error?: string;
  SearchRadiusKM: string;
  OfferExpirySeconds: string;
  RideCount: number;
  Rides: PendingRide[];
  ResponseDateTime: string;
}

/**
 * Polls for ride offers within the server's search radius of the given
 * position. RideCount is 0 with an empty Rides array when nothing's
 * pending — that's a normal/expected response, not an error.
 */
export const getPendingRides = (
  cookie: string,
  latitude: number,
  longitude: number,
) =>
  postAuthForm<GetPendingRidesResponse>(
    'GetPendingRides',
    { cookie, latitude, longitude },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface AcceptRideResponse {
  Result: string;
  Message?: string;
  Error?: string;
  RideTran: string;
  Status: string;
  VehicleType: string;
  Pickup: RidePoint;
  Drop: RidePoint;
  Route: RideRoute;
  TripDistanceKM: string;
  TripDurationMinutes: string;
  EstimatedFare: string;
  EstimatedFareText: string;
  // Confirmed via a real sample response — flat fields, present here
  // (unlike GetPendingRides, which doesn't send these pre-accept).
  CustomerName?: string;
  CustomerMobile?: string;
  ResponseDateTime: string;
}

/**
 * Confirms the partner has taken a ride shown to them via GetPendingRides.
 * Response mirrors the pending-ride shape (minus DistanceToPickupKM/
 * ETAToPickupMinutes, which were only ever relevant pre-accept) plus a
 * Status field — confirmed "ACCEPTED" in the sample response.
 */
export const acceptRide = (cookie: string, rideTran: string) =>
  postAuthForm<AcceptRideResponse>(
    'AcceptRide',
    { cookie, rideTran },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface StartRideResponse {
  Result: string;
  Message?: string;
  Error?: string;
  RideTran: string;
  Status: string;
  Drop: RidePoint;
  EstimatedFare: string;
  EstimatedFareText: string;
  ResponseDateTime: string;
}

/**
 * Starts the trip once the partner has entered the OTP the customer gives
 * them in person at pickup — confirmed via sample: Status flips to
 * "ONGOING" on success. Wrong/expired OTP comes back as a non-"Success"
 * Result (exact rejection Message not yet confirmed against a real
 * failure response, so the UI falls back to a generic message when one
 * isn't provided).
 */
export const startRide = (cookie: string, rideTran: string, otp: string) =>
  postAuthForm<StartRideResponse>(
    'StartRide',
    { cookie, rideTran, otp },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface CompleteRideResponse {
  Result: string;
  Message?: string;
  Error?: string;
  RideTran: string;
  Status: string;
  EstimatedFare: string;
  EstimatedFareText: string;
  ResponseDateTime: string;
}

/**
 * Completes the trip once the partner has dropped the passenger — needs
 * the partner's current position at drop-off (confirmed via sample: same
 * lat/lng pattern as GetPendingRides). Status flips to "COMPLETED" on
 * success and EstimatedFareText here is the real, final fare.
 */
export const completeRide = (
  cookie: string,
  rideTran: string,
  latitude: number,
  longitude: number,
) =>
  postAuthForm<CompleteRideResponse>(
    'CompleteRide',
    { cookie, rideTran, latitude, longitude },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface RideRating {
  ByCustomer: string;
  ByCustomerComment?: string;
  ByPartner: string;
  ByPartnerComment?: string;
}

export interface RideHistoryItem {
  RideId: string;
  RideTran: string;
  VehicleType: string;
  PickupAddress: string;
  DropAddress: string;
  DistanceKM: string;
  DurationMinutes: string;
  FinalFare: string;
  FinalFareText: string;
  Status: string;
  CustomerName: string;
  CustomerMobile: string;
  CreatedDate: string;
  CreatedTime: string;
  CompletedDate: string;
  CompletedTime: string;
  // Present on completed rides once either side has rated — confirmed via
  // the GetRideHistory sample. Absent (not just empty) on rides nobody's
  // rated yet, so treat this as optional rather than defaulting fields.
  Rating?: RideRating;
}

export interface GetRideHistoryResponse {
  Result: string;
  Message?: string;
  Error?: string;
  Rides: RideHistoryItem[];
}

/**
 * Fetches the partner's past ride/trip list for the Trips tab — confirmed
 * via the GetRideHistory curl + response sample. Same host/token/base as
 * the rest of this service (partner-riderequest.asmx).
 */
export const getRideHistory = (cookie: string) =>
  postAuthForm<GetRideHistoryResponse>(
    'GetRideHistory',
    { cookie },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface GetRideDetailResponse {
  Result: string;
  Message?: string;
  Error?: string;
  RideTran: string;
  Status: string;
  VehicleType: string;
  Pickup: RidePoint;
  Drop: RidePoint;
  Route: RideRoute & { DistanceKM: string; DurationMinutes: string };
  EstimatedFare: string;
  EstimatedFareText: string;
  // Flat fields, not nested under a "Customer" object — corrected against
  // a real GetRideDetail sample response (same flat shape as
  // AcceptRideResponse's CustomerName/CustomerMobile).
  CustomerName?: string;
  CustomerMobile?: string;
  // Same shape/optionality as GetRideHistory's Rating — confirmed via the
  // GetRideDetail sample.
  Rating?: RideRating;
  ResponseDateTime: string;
}

/**
 * Fetches full details for a single past ride, keyed by RideTran (not
 * RideId — GetRideHistory returns both per row, but this endpoint only
 * accepts the transaction id) — confirmed via the GetRideDetail curl +
 * response sample. Note EstimatedFare/EstimatedFareText here is the real
 * final fare for COMPLETED rides (same value as GetRideHistory's
 * FinalFare/FinalFareText), it's just not renamed for this endpoint.
 * Doesn't include CreatedDate/CreatedTime — pull those from the
 * GetRideHistory row instead if needed for display.
 */
export const getRideDetail = (cookie: string, rideTran: string) =>
  postAuthForm<GetRideDetailResponse>(
    'GetRideDetail',
    { cookie, rideTran },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface CancelAcceptedRideResponse {
  Result: string;
  Message?: string;
  Error?: string;
  RideTran: string;
  Status: string;
  Reason: string;
  ResponseDateTime: string;
}

/**
 * Cancels a ride the partner already accepted (AcceptRide), releasing it
 * back to search for other partners — confirmed via sample: Status flips
 * from "ACCEPTED" to "SEARCHING" on success.
 */
export const cancelAcceptedRide = (
  cookie: string,
  rideTran: string,
  reason: string = 'CANCELLED',
) =>
  postAuthForm<CancelAcceptedRideResponse>(
    'CancelAcceptedRide',
    { cookie, rideTran, reason },
    API_RIDE_REQUEST_BASE_URL,
  );

export interface SubmitRatingByPartnerResponse {
  Result: string;
  Message?: string;
  Error?: string;
  RideTran: string;
  Rating: string;
  ResponseDateTime: string;
}

/**
 * Submits the partner's post-ride rating (and optional remark) for the
 * passenger — confirmed via the SubmitRatingByPartner curl sample. comment
 * is optional on the backend; pass an empty string when the partner left
 * no remark rather than omitting the field.
 */
export const submitRatingByPartner = (
  cookie: string,
  rideTran: string,
  rating: number,
  comment: string = '',
) =>
  postAuthForm<SubmitRatingByPartnerResponse>(
    'SubmitRatingByPartner',
    { cookie, rideTran, rating, comment },
    API_RIDE_REQUEST_BASE_URL,
  );
