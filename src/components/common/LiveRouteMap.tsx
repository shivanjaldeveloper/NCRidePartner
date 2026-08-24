import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';

import { Colors } from '../../constants/Colors';
import { decodePolyline } from '../../utils/polyline';
import { getRoute, RouteCoordinate, NavStep } from '../../utils/routing';
import {
  bearingBetween,
  findNearestRouteIndex,
  remainingMetersBetween,
  routeRemainingMeters,
} from '../../utils/geo';
import {
  hasLocationPermission,
  useWatchPosition,
} from '../../utils/locationTracker';
import LocateIcon from '../../assets/icons/LocateIcon';
import NavigationInstructionBanner from './NavigationInstructionBanner';

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface RouteProgress {
  distanceMeters: number;
  etaSeconds: number;
}

export interface NavInstruction {
  maneuver: string;
  instruction: string;
  /** Distance (meters) from the driver's current position to this maneuver. */
  distanceMeters: number;
  nextManeuver?: string;
  nextInstruction?: string;
}

interface Props {
  /** Where the pin goes — Pickup while heading there, Drop while on trip. */
  destination: LatLngPoint;
  /** Pin color — e.g. Colors.green for pickup, Colors.ink for drop. */
  destinationColor?: string;
  /**
   * Google-encoded polyline from Route.EncodedPolyline. Omit for screens
   * where there's no route to draw (e.g. ArrivedScreen — partner's already
   * at the pickup point, just showing where they are relative to it). If
   * this is provided but comes back empty/malformed, falls back to an
   * Google Directions-drawn route the same way as if it were omitted entirely.
   */
  encodedPolyline?: string;
  polylineColor?: string;
  /**
   * Whether to draw a fallback Google Directions route (partner's current position ->
   * destination) when no usable encodedPolyline is available. Defaults on
   * for PickupNav/LiveTrip (there should be a route); leave off for
   * screens like Arrived where no route makes sense regardless.
   */
  fallbackRoute?: boolean;
  /**
   * Turns on the actual "navigating" behaviour: watches the partner's
   * live position, keeps the camera centered on them (rotated to their
   * heading, tilted like turn-by-turn nav), and trims the drawn route
   * behind them as they drive. Defaults on. Turn off for static/historical
   * views — e.g. TripDetailScreen, which shows a completed past ride and
   * has no "current position" to navigate from.
   */
  liveNavigation?: boolean;
  /**
   * Fires with live remaining-distance/ETA as the partner drives, or null
   * once there's nothing left to compute (e.g. no route yet). Lets the
   * screen show a real, moving ETA instead of the one static number the
   * ride response came in with.
   */
  onProgressChange?: (progress: RouteProgress | null) => void;
  /**
   * Fires with the current turn-by-turn maneuver as the partner drives —
   * "Turn left in 210m", plus a preview of the maneuver after that — or
   * null when there's no step data to show one (e.g. still fetching the
   * route, or the server-provided polyline has no steps). Screens don't
   * need to render anything for this themselves; the banner below is
   * drawn by LiveRouteMap. It's exposed mainly so a screen can reserve
   * layout space for it (see PickupNavScreen's button offset).
   */
  onInstructionChange?: (instruction: NavInstruction | null) => void;
  /** Whether to draw the turn-by-turn instruction banner at the top of
   * the map. Defaults to `liveNavigation` — off for static/historical
   * views the same as liveNavigation itself. */
  showInstructionBanner?: boolean;
  /**
   * Extra distance (px) to lift the recenter button up from the map's
   * bottom edge. Use this on screens that draw their own button row
   * along the bottom of the map (e.g. PickupNavScreen's SOS/Navigate/
   * Cancel row) so the recenter button doesn't sit underneath it.
   * Defaults to 16 (just clear of the map edge, nothing else there).
   */
  recenterOffsetBottom?: number;
}

const DEFAULT_DELTA = 0.02; // ~2km span, reasonable default zoom
// How far off the drawn path (meters) the partner has to drift before we
// treat it as "took a different road" and ask Google Directions for a fresh line, the
// same trigger real turn-by-turn nav uses to recalculate after a wrong turn.
const OFF_ROUTE_THRESHOLD_M = 120;
const MIN_REROUTE_INTERVAL_MS = 20000;
// No live speed reading yet (GPS just started, or driver's stopped) —
// assume a modest city driving speed so the very first ETA shown isn't
// "Infinity" or 0.
const ASSUMED_SPEED_MPS = 8.3; // ~30 km/h

const LiveRouteMap: React.FC<Props> = ({
  destination,
  destinationColor = Colors.ink,
  encodedPolyline,
  polylineColor = Colors.blue,
  fallbackRoute = true,
  liveNavigation = true,
  onProgressChange,
  onInstructionChange,
  showInstructionBanner,
  recenterOffsetBottom = 16,
}) => {
  const mapRef = useRef<MapView | null>(null);
  const [showsUserLocation, setShowsUserLocation] = useState(false);
  const [fallbackCoords, setFallbackCoords] = useState<RouteCoordinate[]>([]);
  const [fallbackSteps, setFallbackSteps] = useState<NavStep[]>([]);
  const [rerouteCoords, setRerouteCoords] = useState<RouteCoordinate[] | null>(
    null,
  );
  const [rerouteSteps, setRerouteSteps] = useState<NavStep[] | null>(null);
  const [followMode, setFollowMode] = useState(true);
  const [activeInstruction, setActiveInstruction] =
    useState<NavInstruction | null>(null);

  const driverPosition = useWatchPosition(liveNavigation);
  const lastRerouteAtRef = useRef(0);
  const onProgressRef = useRef(onProgressChange);
  onProgressRef.current = onProgressChange;
  const onInstructionRef = useRef(onInstructionChange);
  onInstructionRef.current = onInstructionChange;
  const bannerEnabled = showInstructionBanner ?? liveNavigation;

  const decodedCoords = useMemo(
    () => (encodedPolyline ? decodePolyline(encodedPolyline) : []),
    [encodedPolyline],
  );
  // Priority: a live recalculated route (partner went off the original
  // path) > the server's real route > the Google Directions safety-net route.
  const baseRoute =
    rerouteCoords && rerouteCoords.length > 1
      ? rerouteCoords
      : decodedCoords.length > 1
      ? decodedCoords
      : fallbackCoords;

  // Mirrors the baseRoute ternary above exactly (same branches, same
  // order) so steps never get matched against a route from a different
  // source — e.g. a reroute's coordinates with the previous fallback's
  // steps, which would misalign stepStartIndices with baseRoute.
  const baseSteps: NavStep[] =
    rerouteCoords && rerouteCoords.length > 1
      ? rerouteSteps || []
      : decodedCoords.length > 1
      ? []
      : fallbackSteps;

  // Where each step begins within baseRoute's flat coordinate array —
  // baseRoute is built by concatenating step coordinates end-to-end (see
  // routing.ts), so these indices line up exactly with baseSteps.
  const stepStartIndices = useMemo(() => {
    const idx: number[] = [];
    let cum = 0;
    for (const s of baseSteps) {
      idx.push(cum);
      cum += s.coordinates.length;
    }
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSteps]);

  // Reset any recalculated route as soon as we're navigating to a new
  // place (new ride, or pickup -> drop switchover) rather than carrying a
  // stale reroute over.
  useEffect(() => {
    setRerouteCoords(null);
    setRerouteSteps(null);
    lastRerouteAtRef.current = 0;
  }, [destination.latitude, destination.longitude, encodedPolyline]);

  // showsUserLocation on Android can throw/no-op ungracefully without an
  // already-granted permission — this app already asks for it elsewhere
  // (locationTracker's ensureLocationPermission, run once the partner
  // first goes online), so this is just a read-only check, never a
  // prompt, right before turning the blue dot on.
  useEffect(() => {
    let cancelled = false;
    hasLocationPermission().then(granted => {
      if (!cancelled) setShowsUserLocation(granted);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // No usable polyline from the ride response — draw a real road-following
  // route via Google Directions instead of leaving the map with just a
  // bare pin. Server
  // has included Route.EncodedPolyline on every sample so far, so this is
  // a safety net rather than the normal path.
  useEffect(() => {
    if (!fallbackRoute || decodedCoords.length > 1) {
      console.log(
        '[LiveRouteMap] Fallback route effect: skipped —',
        !fallbackRoute
          ? 'fallbackRoute prop is false'
          : `decodedCoords already has ${decodedCoords.length} points (server polyline in use)`,
      );
      setFallbackCoords([]);
      setFallbackSteps([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const granted = await hasLocationPermission();
        console.log(
          '[LiveRouteMap] Fallback route effect: location permission granted?',
          granted,
        );
        if (!granted || cancelled) return;
        if (!driverPosition) {
          console.log(
            '[LiveRouteMap] Fallback route effect: waiting for first GPS fix (driverPosition is null)',
          );
          return;
        }
        console.log(
          '[LiveRouteMap] Fallback route effect: requesting route from',
          { lat: driverPosition.latitude, lng: driverPosition.longitude },
          'to',
          { lat: destination.latitude, lng: destination.longitude },
        );
        const result = await getRoute(
          { lat: driverPosition.latitude, lng: driverPosition.longitude },
          { lat: destination.latitude, lng: destination.longitude },
        );
        if (cancelled) return;
        if (result) {
          console.log(
            '[LiveRouteMap] Fallback route received —',
            result.coordinates.length,
            'points, setting on map',
          );
          setFallbackCoords(result.coordinates);
          setFallbackSteps(result.steps || []);
        } else {
          console.warn(
            '[LiveRouteMap] getRoute() returned null — no route to draw, map will stay pin-only',
          );
        }
      } catch (err) {
        console.warn(
          '[LiveRouteMap] Fallback route effect threw:',
          String(err),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only (re)run this off the FIRST fix, not every GPS update — ongoing
    // drift off this initial line is handled by the off-route effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    encodedPolyline,
    fallbackRoute,
    destination.latitude,
    destination.longitude,
    !!driverPosition,
  ]);

  // The route drawn on the map is "eaten" behind the driver as they
  // drive, rather than always showing the full original path — this is
  // the bit that makes it read as active navigation instead of a static
  // preview line.
  const displayRoute = useMemo(() => {
    if (!driverPosition || baseRoute.length < 2) return baseRoute;
    const { index } = findNearestRouteIndex(driverPosition, baseRoute);
    // Keep one point behind the nearest match so the line doesn't visibly
    // snap ahead of the blue dot in the gap between GPS fixes.
    const from = Math.max(0, index - 1);
    return baseRoute.slice(from);
  }, [driverPosition, baseRoute]);

  // Gone far enough off the drawn path (took a different turn, road
  // closure, etc.) — ask Google Directions for a fresh route from where the partner
  // actually is now, the same "recalculating" behaviour real nav apps do.
  useEffect(() => {
    if (!liveNavigation || !fallbackRoute || !driverPosition) return;
    if (baseRoute.length < 2) return;
    const { distanceMeters } = findNearestRouteIndex(driverPosition, baseRoute);
    if (distanceMeters < OFF_ROUTE_THRESHOLD_M) return;
    const now = Date.now();
    if (now - lastRerouteAtRef.current < MIN_REROUTE_INTERVAL_MS) return;
    lastRerouteAtRef.current = now;
    (async () => {
      const result = await getRoute(
        { lat: driverPosition.latitude, lng: driverPosition.longitude },
        { lat: destination.latitude, lng: destination.longitude },
      );
      if (result) {
        setRerouteCoords(result.coordinates);
        setRerouteSteps(result.steps || []);
      }
    })();
  }, [
    driverPosition,
    baseRoute,
    liveNavigation,
    fallbackRoute,
    destination.latitude,
    destination.longitude,
  ]);

  // Report live remaining distance/ETA up to whoever's showing the ETA
  // strip, so it can move as the partner actually drives instead of
  // sitting on the one static number the ride response came in with.
  useEffect(() => {
    const cb = onProgressRef.current;
    if (!cb) return;
    if (!driverPosition || displayRoute.length < 2) {
      cb(null);
      return;
    }
    const distanceMeters = routeRemainingMeters(displayRoute, 0);
    const speed =
      driverPosition.speed && driverPosition.speed > 1
        ? driverPosition.speed
        : ASSUMED_SPEED_MPS;
    cb({ distanceMeters, etaSeconds: distanceMeters / speed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRoute, driverPosition?.speed, !!driverPosition]);

  // Figure out which maneuver step the driver is currently on, and how
  // far they still have to go before it — this is the same "nearest point
  // on the route" match the progress effect above uses, just resolved
  // against step boundaries instead of the route's overall end. Because
  // this recomputes on every position update, the active step advances
  // naturally as soon as the driver's nearest point crosses into the next
  // step's range — no separate "did we complete the turn" state needed.
  useEffect(() => {
    const cb = onInstructionRef.current;
    const finish = (val: NavInstruction | null) => {
      setActiveInstruction(val);
      cb?.(val);
    };
    if (!driverPosition || baseRoute.length < 2 || baseSteps.length === 0) {
      finish(null);
      return;
    }
    const { index: nearestIndex } = findNearestRouteIndex(
      driverPosition,
      baseRoute,
    );
    let stepIndex = 0;
    for (let i = 0; i < stepStartIndices.length; i++) {
      if (stepStartIndices[i] <= nearestIndex) stepIndex = i;
      else break;
    }
    const step = baseSteps[stepIndex];
    if (!step) {
      finish(null);
      return;
    }
    const nextStepStart = stepStartIndices[stepIndex + 1];
    const distanceToManeuver =
      nextStepStart != null
        ? remainingMetersBetween(baseRoute, nearestIndex, nextStepStart)
        : routeRemainingMeters(baseRoute, nearestIndex);
    const next = baseSteps[stepIndex + 1];
    finish({
      maneuver: step.maneuver,
      instruction: step.instruction,
      distanceMeters: distanceToManeuver,
      nextManeuver: next?.maneuver,
      nextInstruction: next?.instruction,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPosition, baseRoute, baseSteps, stepStartIndices]);

  const initialRegion: Region = {
    latitude: destination.latitude,
    longitude: destination.longitude,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };

  // Before the first live fix (or with liveNavigation off), just fit the
  // whole route on screen like a preview. Once a fix arrives, the
  // follow-camera effect below takes over instead.
  useEffect(() => {
    if (liveNavigation && driverPosition) return;
    if (displayRoute.length < 2 || !mapRef.current) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(displayRoute, {
        edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRoute.length, liveNavigation, !!driverPosition]);

  // This is "navigation starting": as soon as we have the partner's real
  // position, swing the camera onto them, tilted and rotated to their
  // heading of travel, and keep it locked there as they move — a driving
  // POV rather than a fixed top-down preview.
  useEffect(() => {
    if (!liveNavigation || !driverPosition || !followMode || !mapRef.current) {
      return;
    }
    const heading =
      driverPosition.heading ??
      (displayRoute.length > 1
        ? bearingBetween(driverPosition, displayRoute[1] ?? displayRoute[0])
        : 0);
    mapRef.current.animateCamera(
      {
        center: {
          latitude: driverPosition.latitude,
          longitude: driverPosition.longitude,
        },
        heading,
        pitch: 45,
        zoom: 17,
      },
      { duration: 500 },
    );
  }, [driverPosition, followMode, liveNavigation, displayRoute]);

  const showRecenter = liveNavigation && !!driverPosition && !followMode;

  const recenter = () => {
    setFollowMode(true);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        onPanDrag={() => {
          // Partner touched the map — hand control back to them until
          // they tap the recenter button, same as Google/Apple Maps nav.
          if (liveNavigation) setFollowMode(false);
        }}
      >
        <Marker coordinate={destination} pinColor={destinationColor} />
        {displayRoute.length > 1 && (
          <Polyline
            coordinates={displayRoute}
            strokeColor={polylineColor}
            strokeWidth={5}
          />
        )}
      </MapView>

      {showRecenter && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: recenterOffsetBottom }]}
          onPress={recenter}
          activeOpacity={0.85}
        >
          <LocateIcon size={18} color={Colors.ink} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {bannerEnabled && activeInstruction && (
        <NavigationInstructionBanner
          distanceMeters={activeInstruction.distanceMeters}
          maneuver={activeInstruction.maneuver}
          instruction={activeInstruction.instruction}
          nextManeuver={activeInstruction.nextManeuver}
          nextInstruction={activeInstruction.nextInstruction}
        />
      )}
    </View>
  );
};

export default LiveRouteMap;

const styles = StyleSheet.create({
  recenterButton: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
