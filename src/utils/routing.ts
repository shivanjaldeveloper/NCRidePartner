import { GOOGLE_MAPS_API_KEY } from '../constants/mapsConfig';
import { decodePolyline } from './polyline';

export type RouteCoordinate = { latitude: number; longitude: number };

// Normalized maneuver keys — follows Google Directions' own vocabulary
// (turn-left, turn-slight-right, uturn-left, roundabout-right, merge,
// fork-left, straight, depart, arrive, ...).
export type ManeuverType = string;

export interface NavStep {
  maneuver: ManeuverType;
  /** Plain-text instruction, e.g. "Turn left onto MG Road". */
  instruction: string;
  distanceMeters: number;
  distanceText?: string;
  /** This step's own path, in order — concatenating every step's
   * coordinates end-to-end reproduces the full route. */
  coordinates: RouteCoordinate[];
}

export type RouteResult = {
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  /** Turn-by-turn steps, present when the provider returned maneuver-level
   * data. Empty when a route came back without
   * steps for any reason — callers should treat that as "no turn banner
   * available" rather than an error. */
  steps: NavStep[];
};

// Strips the <b>/<div> markup Google wraps its instructions in (e.g.
// "Turn <b>left</b> onto <b>MG Road</b><div style=...>Destination will be
// on the right</div>") down to plain, single-line text.
function stripHtmlInstruction(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<div[^>]*>/gi, ' — ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Used by LiveRouteMap as a fallback ONLY when a ride response doesn't
// include Route.EncodedPolyline (every sample we've seen does include
// it), and for the driver->pickup leg specifically, where there IS no
// server-provided route at all (Route on the ride object is the
// Pickup->Drop trip route, not this leg — see PickupNavScreen/
// ArrivedScreen). Google Directions is now the only route source.
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    console.log(
      '[routing] fetch responded, HTTP status:',
      res.status,
      '— url host:',
      url.split('/')[2],
    );
    return res;
  } catch (err) {
    console.warn(
      '[routing] fetch failed/timed out — url host:',
      url.split('/')[2],
      'error:',
      String(err),
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const GOOGLE_DIRECTIONS_BASE =
  'https://maps.googleapis.com/maps/api/directions/json';

// Primary: Google Directions. Requires "Directions API" enabled (and
// billing set up) on the same Google Cloud project as the key in
// constants/mapsConfig.ts. Also reuses decodePolyline from polyline.ts
// since Google's step/overview polylines are the exact same encoding as
// Route.EncodedPolyline on the ride responses.
async function getRouteFromGoogle(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult | null> {
  try {
    const url =
      `${GOOGLE_DIRECTIONS_BASE}?origin=${origin.lat},${origin.lng}` +
      `&destination=${destination.lat},${destination.lng}` +
      `&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('[routing] Trying Google Directions...');
    const res = await fetchWithTimeout(url);
    if (!res || !res.ok) {
      console.warn(
        '[routing] Google Directions HTTP failure — res:',
        res ? res.status : 'null (timeout/network error)',
      );
      return null;
    }
    const json = await res.json();
    if (json.status !== 'OK') {
      console.warn(
        '[routing] Google Directions returned',
        json.status,
        '—',
        json.error_message || '(no error_message in response)',
      );
      return null;
    }
    const route = json.routes?.[0];
    const leg = route?.legs?.[0];
    const rawSteps: any[] = leg?.steps ?? [];

    // Build turn-by-turn steps from each leg step's own polyline — this is
    // the exact same encoding as overview_polyline, just one small segment
    // per maneuver instead of one simplified line for the whole route.
    // Using these (concatenated) as `coordinates` instead of the overview
    // polyline means the driven path and the maneuver boundaries line up
    // exactly, which is what lets LiveRouteMap figure out "how far to the
    // next turn" by walking the same array the turn banner is keyed off.
    const steps: NavStep[] = rawSteps
      .map(s => ({
        maneuver: s.maneuver || 'straight',
        instruction: stripHtmlInstruction(s.html_instructions),
        distanceMeters: s.distance?.value ?? 0,
        distanceText: s.distance?.text,
        coordinates: s.polyline?.points
          ? decodePolyline(s.polyline.points)
          : [],
      }))
      .filter(s => s.coordinates.length > 0);

    let coordinates = steps.length > 0 ? steps.flatMap(s => s.coordinates) : [];
    if (coordinates.length === 0) {
      const points = route?.overview_polyline?.points;
      if (!points) {
        console.warn(
          '[routing] Google Directions OK but no overview_polyline in response',
        );
        return null;
      }
      coordinates = decodePolyline(points);
    }
    if (coordinates.length === 0) {
      console.warn('[routing] Google Directions polyline decoded to 0 points');
      return null;
    }
    return {
      coordinates,
      distanceMeters: leg?.distance?.value ?? 0,
      durationSeconds: leg?.duration?.value ?? 0,
      steps,
    };
  } catch (err) {
    console.warn('[routing] Google Directions threw:', String(err));
    return null;
  }
}

export const getRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult | null> => {
  console.log(
    '[routing] getRoute called — origin:',
    origin,
    'destination:',
    destination,
  );
  const google = await getRouteFromGoogle(origin, destination);
  if (google) {
    console.log(
      '[routing] Google Directions SUCCESS —',
      google.coordinates.length,
      'points,',
      (google.distanceMeters / 1000).toFixed(2),
      'km,',
      Math.round(google.durationSeconds / 60),
      'min,',
      google.steps.length,
      'steps',
    );
  } else {
    console.log('[routing] Google Directions failed — no route available');
  }
  return google;
};
