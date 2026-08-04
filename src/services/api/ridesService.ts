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
