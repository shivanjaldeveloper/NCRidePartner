import { useEffect, useRef, useState } from 'react';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
// Assumes @react-native-community/geolocation is already/about to be a
// dependency of this project (same "assume it's installed, flag it if
// not" convention as session.ts's AsyncStorage note):
//   npm install @react-native-community/geolocation
// Also needs, natively (not included in a src/-only handoff):
//   Android: ACCESS_FINE_LOCATION (+ ACCESS_COARSE_LOCATION) in
//     AndroidManifest.xml — requested at runtime below via
//     PermissionsAndroid regardless, but the manifest entry has to exist
//     first or the runtime prompt itself won't appear.
//   iOS: NSLocationWhenInUseUsageDescription in Info.plist (and
//     NSLocationAlwaysAndWhenInUseUsageDescription too if this needs to
//     keep sending while the app is fully backgrounded/killed later —
//     see the note at the bottom of this file about that).
import Geolocation from '@react-native-community/geolocation';
import { getCookie } from './session';
import { updatePartnerLocation } from '../services/api/locationService';

// "Every 15 or 30 seconds" — was set to 10000 (10s), which is SHORTER
// than getCurrentPositionAccurate's own 15s GPS timeout. That meant a new
// tick could get scheduled before the previous one had even finished
// timing out, which is exactly what the "skip tick — previous update
// still in flight" spam in testing was — not a bug in the skip logic
// itself, just an interval shorter than the worst-case time a single tick
// can take. 20s sits comfortably above that worst case.
const UPDATE_INTERVAL_MS = 20000;

// Empty for now — this is just the partner's general live location, not
// tied to a ride. Pass a real rideTran into useLiveLocationTracker once
// there's an active ride to attach these pings to.
const DEFAULT_RIDE_TRAN = '';

const LOG_PREFIX = '[LocationTracker]';

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // iOS prompts automatically off the Info.plist description the first
    // time getCurrentPosition is called — nothing to request up front.
    return true;
  }
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message:
          'NCRide Partner needs your location to send live updates while you\u2019re online.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
    console.log(`${LOG_PREFIX} Android permission request result:`, granted);
    return ok;
  } catch (err) {
    console.warn(`${LOG_PREFIX} permission request threw:`, err);
    return false;
  }
}

// Read-only — never shows a dialog. Used by LiveRouteMap to decide whether
// it's safe to turn on showsUserLocation, and by anything else that just
// needs to know "do we already have it" without prompting.
//
// Checks EITHER fine or coarse being granted, not fine alone —
// ensureLocationPermission above only ever requests FINE, but Android 12+
// lets the user grant just "Approximate" (COARSE) instead, which Settings
// shows as location being ON. Checking FINE only here would report "not
// granted" for that user forever, even though they said yes.
export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // Mirrors ensureLocationPermission's own iOS assumption — if this app
    // is already doing live location tracking elsewhere, the OS prompt
    // has already been through once.
    return true;
  }
  try {
    const [fine, coarse] = await Promise.all([
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ),
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ),
    ]);
    return fine || coarse;
  } catch (err) {
    console.warn(`${LOG_PREFIX} permission check threw:`, err);
    return false;
  }
}

// Two different needs, two different strategies:
//
// 1. checkLocationReady() (used once, when the partner taps "Go Online")
//    only needs to confirm location genuinely works — accuracy doesn't
//    matter. A raw GPS satellite lock can take a long time or fail
//    entirely indoors / on an emulator / weak signal, even when Location
//    is genuinely ON — forcing that as the only option is exactly what
//    caused "location + permission are both on, still can't go online."
//    So this path tries a fast network/cell/wifi fix first, GPS as backup.
//
// 2. The periodic tracking tick (every ~10-20s while online) needs REAL
//    speed/heading for the ride telemetry sent to the server. Only a GPS
//    fix actually reports speed/heading — a network/wifi/cell fix reports
//    neither (they come back null/undefined), which is why speed and
//    heading were always showing as 0 even on a real bike ride: the old
//    single getCurrentPosition() tried network first, got a fast success,
//    and never even attempted the GPS fix that would've had real numbers.
//    So this path tries GPS first, network only as a last-resort fallback
//    (better to send a position with speed/heading than skip the tick
//    entirely, but the fallback case will still read 0 for both).
function attemptPosition(options: {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position: any) => resolve(position),
      (error: any) => reject(error),
      options,
    );
  });
}

export function getCurrentPositionQuick(): Promise<any> {
  return attemptPosition({
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 60000,
  }).catch((fastErr: any) => {
    console.warn(
      `${LOG_PREFIX} quick location fix failed, falling back to GPS:`,
      fastErr?.message || fastErr,
    );
    return attemptPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });
  });
}

function getCurrentPositionAccurate(): Promise<any> {
  return attemptPosition({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  }).catch((gpsErr: any) => {
    console.warn(
      `${LOG_PREFIX} GPS fix failed for tracking tick, falling back to network (speed/heading will read 0 this tick):`,
      gpsErr?.message || gpsErr,
    );
    return attemptPosition({
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 15000,
    });
  });
}

export type LocationUnreadyReason =
  | 'permission_denied'
  | 'location_disabled'
  | 'timeout'
  | 'unknown';

export interface LocationReadyResult {
  ready: boolean;
  reason?: LocationUnreadyReason;
  message?: string;
}

// @react-native-community/geolocation error codes: 1 = PERMISSION_DENIED,
// 2 = POSITION_UNAVAILABLE (this is what "No location provider available"
// / GPS toggled off at the OS level comes through as), 3 = TIMEOUT.
function mapGeoError(error: any): {
  reason: LocationUnreadyReason;
  message: string;
} {
  const code = error?.code;
  if (code === 1) {
    return {
      reason: 'permission_denied',
      message:
        'Location permission is required to go online. Please allow location access and try again.',
    };
  }
  if (code === 2) {
    return {
      reason: 'location_disabled',
      message: 'Location is turned off. Please turn on Location to go online.',
    };
  }
  if (code === 3) {
    return {
      reason: 'timeout',
      message:
        "Couldn't get a GPS fix. Make sure Location is turned on and try again.",
    };
  }
  return {
    reason: 'unknown',
    message:
      error?.message ||
      'Could not determine your location. Please check your Location settings and try again.',
  };
}

/**
 * Sends the partner to the right settings screen for whatever's actually
 * wrong — Android can deep-link straight to the system Location toggle;
 * both platforms can deep-link to this app's own permission page.
 */
export function openLocationSettings(reason?: LocationUnreadyReason) {
  console.log(`${LOG_PREFIX} opening settings for reason:`, reason);
  if (Platform.OS === 'android') {
    if (reason === 'permission_denied') {
      // App's own settings page, where the location permission toggle lives.
      Linking.openSettings().catch((err: any) =>
        console.warn(`${LOG_PREFIX} openSettings failed:`, err),
      );
    } else {
      // Straight to the system-wide Location on/off screen.
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(
        (err: any) => {
          console.warn(
            `${LOG_PREFIX} sendIntent(LOCATION_SOURCE_SETTINGS) failed, falling back to app settings:`,
            err,
          );
          Linking.openSettings().catch(() => {});
        },
      );
    }
  } else {
    // iOS doesn't expose a deep link to the system Location Services
    // toggle (Apple removed the old prefs: scheme) — this app's own
    // settings page is as close as it gets, and is where the per-app
    // Location permission lives anyway.
    Linking.openURL('app-settings:').catch((err: any) =>
      console.warn(`${LOG_PREFIX} openURL(app-settings:) failed:`, err),
    );
  }
}

/**
 * One-shot check — call this at the moment the partner taps "Go Online",
 * before flipping the online state. Confirms both that the permission is
 * granted AND that device Location/GPS is actually switched on (a granted
 * permission alone doesn't mean the OS Location toggle is on — that's
 * exactly what showed up as "No location provider available" in testing).
 */
export async function checkLocationReady(): Promise<LocationReadyResult> {
  const hasPermission = await ensureLocationPermission();
  if (!hasPermission) {
    console.warn(`${LOG_PREFIX} readiness check — permission not granted`);
    return {
      ready: false,
      reason: 'permission_denied',
      message:
        'Location permission is required to go online. Please allow location access and try again.',
    };
  }

  try {
    await getCurrentPositionQuick();
    console.log(`${LOG_PREFIX} readiness check — OK`);
    return { ready: true };
  } catch (err: any) {
    const mapped = mapGeoError(err);
    console.warn(
      `${LOG_PREFIX} readiness check failed:`,
      mapped.reason,
      err?.message || err,
    );
    return { ready: false, ...mapped };
  }
}

// If the partner flips Location off (or revokes permission) while already
// online, we can't stop the OS toggle from changing — only react to it.
// Two consecutive failed ticks (~40s at the 20s interval) is treated as
// "actually off," not a one-off GPS blip, before escalating.
const LOCATION_FAILURE_THRESHOLD = 2;

export interface UseLiveLocationTrackerOptions {
  rideTran?: string;
  /**
   * Fires once per "episode" after LOCATION_FAILURE_THRESHOLD consecutive
   * ticks fail to get a GPS fix — resets as soon as a tick succeeds again.
   * Use this to force the partner back offline and tell them why, since
   * the app can't prevent the OS Location toggle from being switched off.
   */
  onLocationUnavailable?: (result: LocationReadyResult) => void;
}

/**
 * Mount with `enabled = true` while the partner is online (e.g. in
 * HomeScreen, tied to the same `online` state that gates "Go Online").
 * Fires an immediate ping on becoming enabled, then every
 * UPDATE_INTERVAL_MS after that. Every step is logged with the
 * [LocationTracker] prefix so the full trail — permission result, GPS fix,
 * request, response — shows up in Metro/logcat/Xcode console.
 *
 * On every tick:
 *  - No cookie (not logged in) → skip, logged, try again next tick.
 *  - No location permission → skip, logged as a warning, counts as a
 *    failure toward onLocationUnavailable.
 *  - GPS fix fails (signal, timeout, Location switched off) → skip,
 *    logged as a warning, counts as a failure toward onLocationUnavailable.
 *    Never throws up into the UI on its own — only the escalation
 *    callback (after the threshold) does anything user-visible.
 *  - Success → PartnerLocationUpdate is called, the full response
 *    (LiveTransaction, HistoryTransaction, etc.) is logged, and the
 *    failure counter resets.
 */
export function useLiveLocationTracker(
  enabled: boolean,
  options: UseLiveLocationTrackerOptions = {},
) {
  const { rideTran = DEFAULT_RIDE_TRAN, onLocationUnavailable } = options;
  const inFlightRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const notifiedRef = useRef(false);
  // Keep the latest callback in a ref so changing it doesn't restart the
  // interval (only `enabled`/`rideTran` should do that).
  const onLocationUnavailableRef = useRef(onLocationUnavailable);
  onLocationUnavailableRef.current = onLocationUnavailable;

  useEffect(() => {
    if (!enabled) {
      console.log(`${LOG_PREFIX} disabled — not tracking`);
      consecutiveFailuresRef.current = 0;
      notifiedRef.current = false;
      return;
    }

    let cancelled = false;

    const registerFailure = (result: LocationReadyResult) => {
      consecutiveFailuresRef.current += 1;
      console.warn(
        `${LOG_PREFIX} consecutive location failures:`,
        consecutiveFailuresRef.current,
      );
      if (
        consecutiveFailuresRef.current >= LOCATION_FAILURE_THRESHOLD &&
        !notifiedRef.current
      ) {
        notifiedRef.current = true;
        console.warn(
          `${LOG_PREFIX} location unavailable for ${LOCATION_FAILURE_THRESHOLD} consecutive ticks — escalating`,
        );
        onLocationUnavailableRef.current?.(result);
      }
    };

    const registerSuccess = () => {
      consecutiveFailuresRef.current = 0;
      notifiedRef.current = false;
    };

    const tick = async () => {
      if (inFlightRef.current) {
        console.log(
          `${LOG_PREFIX} skip tick — previous update still in flight`,
        );
        return;
      }
      inFlightRef.current = true;
      console.log(`${LOG_PREFIX} tick start`, new Date().toISOString());

      try {
        const cookie = await getCookie();
        if (!cookie) {
          console.log(`${LOG_PREFIX} skip tick — no session cookie`);
          return;
        }

        const hasPermission = await ensureLocationPermission();
        if (!hasPermission) {
          console.warn(
            `${LOG_PREFIX} skip tick — location permission not granted`,
          );
          registerFailure({
            ready: false,
            reason: 'permission_denied',
            message:
              'Location permission was turned off. Please allow location access again.',
          });
          return;
        }

        let position: any;
        try {
          position = await getCurrentPositionAccurate();
        } catch (gpsErr: any) {
          const mapped = mapGeoError(gpsErr);
          console.warn(
            `${LOG_PREFIX} skip tick — could not get GPS fix:`,
            mapped.reason,
            gpsErr?.message || gpsErr,
          );
          registerFailure({ ready: false, ...mapped });
          return;
        }

        if (cancelled) return;

        registerSuccess();

        const { latitude, longitude, accuracy, speed, heading } =
          position.coords;
        const payload = {
          cookie,
          rideTran,
          latitude,
          longitude,
          accuracy: accuracy ?? 0,
          // Geolocation reports speed in m/s and can return negative
          // values when the fix is stationary/invalid — clamp to 0 rather
          // than send garbage.
          speed: speed && speed > 0 ? speed : 0,
          heading: heading ?? 0,
        };
        console.log(`${LOG_PREFIX} sending PartnerLocationUpdate`, payload);

        const res = await updatePartnerLocation(payload);

        if (cancelled) return;

        if (res.Result === 'Success') {
          console.log(`${LOG_PREFIX} update succeeded`, {
            liveTransaction: res.LiveTransaction,
            historyTransaction: res.HistoryTransaction,
            responseDateTime: res.ResponseDateTime,
          });
        } else {
          console.warn(`${LOG_PREFIX} update rejected by server:`, res);
        }
      } catch (err: any) {
        console.warn(`${LOG_PREFIX} tick failed:`, err?.message || err);
      } finally {
        inFlightRef.current = false;
        console.log(`${LOG_PREFIX} tick end`, new Date().toISOString());
      }
    };

    tick(); // send one immediately on going online, don't wait a full interval
    const interval = setInterval(tick, UPDATE_INTERVAL_MS);
    console.log(`${LOG_PREFIX} started — every ${UPDATE_INTERVAL_MS / 1000}s`);

    return () => {
      cancelled = true;
      clearInterval(interval);
      console.log(`${LOG_PREFIX} stopped`);
    };
  }, [enabled, rideTran]);
}

export interface WatchedPosition {
  latitude: number;
  longitude: number;
  /** Degrees, 0-360, null when the device can't report one (e.g. stationary). */
  heading: number | null;
  /** m/s, null when unavailable or non-positive (treated as "no reading"). */
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

// How far (meters) the partner has to actually move before the OS pushes
// a new fix — small enough to feel live while driving, large enough that
// GPS jitter while stationary at a light doesn't spam updates/re-renders.
const WATCH_DISTANCE_FILTER_M = 8;

/**
 * Continuous, JS-side copy of the partner's position while `enabled` —
 * separate from useLiveLocationTracker above, which is the periodic
 * "ping the server" tracker. This one is purely local: it's what powers
 * LiveRouteMap's follow-camera and the "trim the route as you drive"
 * behaviour on PickupNav/LiveTrip, and doesn't touch the network at all.
 *
 * Never prompts for permission itself — by the time a partner reaches a
 * screen using this, they've already gone online once (which does
 * prompt), so this only ever does a silent read-only check. If somehow
 * permission isn't there, it just stays null rather than surprise the
 * partner with a permission dialog mid-navigation.
 */
export function useWatchPosition(enabled: boolean): WatchedPosition | null {
  const [position, setPosition] = useState<WatchedPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setPosition(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const granted = await hasLocationPermission();
      if (cancelled) return;
      if (!granted) {
        console.warn(
          `${LOG_PREFIX} useWatchPosition — permission not granted, skipping live watch`,
        );
        return;
      }

      // Seed a position immediately using the same quick(low-accuracy)
      // -> GPS fallback strategy proven elsewhere in this file, instead
      // of waiting on watchPosition's first callback. On devices where
      // high-accuracy GPS times out (confirmed happening repeatedly via
      // getCurrentPositionAccurate's own logs on some test devices/
      // emulators), watchPosition below can go a very long time — or
      // effectively forever — without ever calling back OR erroring,
      // leaving driverPosition stuck at null indefinitely with nothing
      // in the logs to explain why. This guarantees SOME position (even
      // a coarse network one) lands quickly, which is what unblocks the
      // fallback-route fetch and the follow-camera; true GPS fixes just
      // refine it further once/if they arrive via the watch below.
      try {
        const seed = await getCurrentPositionQuick();
        if (cancelled) return;
        const { latitude, longitude, heading, speed, accuracy } = seed.coords;
        console.log(
          `${LOG_PREFIX} useWatchPosition — seeded initial position (quick fix):`,
          { latitude, longitude, accuracy },
        );
        setPosition({
          latitude,
          longitude,
          heading: heading ?? null,
          speed: speed && speed > 0 ? speed : null,
          accuracy: accuracy ?? null,
          timestamp: seed.timestamp,
        });
      } catch (err: any) {
        console.warn(
          `${LOG_PREFIX} useWatchPosition — seed fix failed (will still try the live watch below):`,
          err?.message || err,
        );
      }
      if (cancelled) return;

      console.log(`${LOG_PREFIX} useWatchPosition — starting GPS watch`);
      let fixCount = 0;
      watchIdRef.current = Geolocation.watchPosition(
        (pos: any) => {
          if (cancelled) return;
          const { latitude, longitude, heading, speed, accuracy } = pos.coords;
          fixCount += 1;
          // Log the first fix in full (that's the one everything else is
          // waiting on), then just a short heartbeat after that so this
          // doesn't flood logcat on a long drive.
          if (fixCount === 1) {
            console.log(
              `${LOG_PREFIX} useWatchPosition — FIRST live watch fix:`,
              { latitude, longitude, heading, speed, accuracy },
            );
          } else if (fixCount % 5 === 0) {
            console.log(
              `${LOG_PREFIX} useWatchPosition — fix #${fixCount}:`,
              latitude.toFixed(5),
              longitude.toFixed(5),
            );
          }
          setPosition({
            latitude,
            longitude,
            heading: heading ?? null,
            speed: speed && speed > 0 ? speed : null,
            accuracy: accuracy ?? null,
            timestamp: pos.timestamp,
          });
        },
        (err: any) => {
          // Expected/harmless on devices with flaky high-accuracy GPS —
          // the seed above already got something on screen, this is just
          // the live watch occasionally missing a beat.
          console.warn(
            `${LOG_PREFIX} watchPosition error:`,
            err?.code,
            err?.message || err,
          );
        },
        {
          enableHighAccuracy: true,
          distanceFilter: WATCH_DISTANCE_FILTER_M,
          interval: 4000,
          fastestInterval: 2000,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled]);

  return position;
}

// NOTE on "background": this sends on a JS setInterval, same mechanism as
// the existing useSessionWatcher — it keeps firing while the app is
// foregrounded, and for a little while after backgrounding until the OS
// suspends the JS thread (varies by device/OS). It will NOT keep firing
// indefinitely with the app fully backgrounded or killed — that needs a
// native background task (e.g. react-native-background-fetch, or a real
// Android foreground service) which is a separate, bigger piece of work.
// Say the word if partners need updates to keep flowing with the app
// fully backgrounded/killed and I'll wire that up next.
