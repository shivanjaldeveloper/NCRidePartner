export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two points, in meters. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Compass bearing (0-360, 0 = north) from `a` pointing at `b`. */
export function bearingBetween(a: LatLng, b: LatLng): number {
  const y =
    Math.sin(toRad(b.longitude - a.longitude)) * Math.cos(toRad(b.latitude));
  const x =
    Math.cos(toRad(a.latitude)) * Math.sin(toRad(b.latitude)) -
    Math.sin(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.cos(toRad(b.longitude - a.longitude));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Index of the route point closest to `point`, plus how far off the route
 * that point actually is. Used two ways by LiveRouteMap:
 *  - Trim the polyline so it "eats up" behind the driver as they drive,
 *    instead of always drawing the full original path.
 *  - Detect when the driver has gone off-route (large distanceMeters) so
 *    a fresh Google Directions route can be requested, the same way real turn-by-turn
 *    nav recalculates after a wrong turn.
 */
export function findNearestRouteIndex(
  point: LatLng,
  route: LatLng[],
): { index: number; distanceMeters: number } {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = haversineMeters(point, route[i]);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }
  return { index: bestIndex, distanceMeters: bestDistance };
}

/** Remaining road distance (meters) walking the route from `fromIndex` on. */
export function routeRemainingMeters(
  route: LatLng[],
  fromIndex: number,
): number {
  let total = 0;
  for (let i = fromIndex; i < route.length - 1; i++) {
    total += haversineMeters(route[i], route[i + 1]);
  }
  return total;
}

/**
 * Road distance (meters) walking the route from `fromIndex` up to (but not
 * past) `toIndex`. Used to get "distance to the next turn" rather than
 * distance to the final destination — same idea as routeRemainingMeters,
 * just capped at a maneuver boundary instead of the end of the route.
 */
export function remainingMetersBetween(
  route: LatLng[],
  fromIndex: number,
  toIndex: number,
): number {
  let total = 0;
  const end = Math.min(toIndex, route.length - 1);
  for (let i = fromIndex; i < end; i++) {
    total += haversineMeters(route[i], route[i + 1]);
  }
  return total;
}
