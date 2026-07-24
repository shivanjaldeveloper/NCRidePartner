import { useEffect, useRef } from 'react';
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

// "Every 15 or 30 seconds" — 20s sits comfortably in that window, same
// reasoning as sessionWatcher's interval choice.
const UPDATE_INTERVAL_MS = 10000;

// Hardcoded per current backend guidance ("the rideTran will be 1234567890
// all the time for now"). Swap the default here (or pass a real rideTran
// into useLiveLocationTracker) once ride-tracking is wired up.
const DEFAULT_RIDE_TRAN = '1234567890';

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

// A raw GPS satellite lock (enableHighAccuracy: true) can take a long time
// or fail entirely indoors / on an emulator / with a weak signal — even
// when device Location is genuinely switched ON. Forcing that as the only
// option is exactly what caused "location + permission are both on, still
// can't go online": the fix would time out and get misread as "off."
// Instead: try a fast network/cell/wifi-based fix first (near-instant,
// works indoors), and only fall back to a slower high-accuracy GPS
// attempt if that somehow fails.
function getCurrentPosition(): Promise<any> {
  const attempt = (options: {
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
  }) =>
    new Promise<any>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: any) => resolve(position),
        (error: any) => reject(error),
        options,
      );
    });

  return attempt({
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 60000,
  }).catch((fastErr: any) => {
    console.warn(
      `${LOG_PREFIX} fast location fix failed, falling back to GPS:`,
      fastErr?.message || fastErr,
    );
    return attempt({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
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
    await getCurrentPosition();
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
          position = await getCurrentPosition();
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

// NOTE on "background": this sends on a JS setInterval, same mechanism as
// the existing useSessionWatcher — it keeps firing while the app is
// foregrounded, and for a little while after backgrounding until the OS
// suspends the JS thread (varies by device/OS). It will NOT keep firing
// indefinitely with the app fully backgrounded or killed — that needs a
// native background task (e.g. react-native-background-fetch, or a real
// Android foreground service) which is a separate, bigger piece of work.
// Say the word if partners need updates to keep flowing with the app
// fully backgrounded/killed and I'll wire that up next.
