import { Linking, Platform } from 'react-native';

const LOG_PREFIX = '[ExternalNav]';

export interface NavDestination {
  latitude: number;
  longitude: number;
  /** Optional label shown on the destination pin in the launched map app. */
  label?: string;
}

// react-native-maps only ever draws what we hand it (a polyline) — it has
// no turn-by-turn engine, no spoken directions, no lane guidance, no
// live re-routing off a wrong turn. LiveRouteMap now does a reasonable
// in-app approximation of "navigation" (live position, route trimmed as
// the partner drives, camera that follows and rotates with heading), but
// for the *real* voice-guided driving experience every other ride-hailing
// driver app (Uber, Ola, Rapido, etc.) hands off to the phone's own map
// app instead of building a nav engine from scratch. This does that.
//
// Native setup this needs (JS alone can't add these):
//   iOS Info.plist — LSApplicationQueriesSchemes must list "comgooglemaps"
//   and "maps", or canOpenURL() below will always report false for them
//   even when the apps are installed:
//     <key>LSApplicationQueriesSchemes</key>
//     <array>
//       <string>comgooglemaps</string>
//       <string>maps</string>
//     </array>
//   Android — no manifest change needed; google.navigation: and https
//   links both resolve without a <queries> entry.
export async function openTurnByTurnNavigation(
  destination: NavDestination,
): Promise<boolean> {
  const { latitude, longitude } = destination;

  if (Platform.OS === 'android') {
    // google.navigation drops the partner straight into turn-by-turn
    // DRIVING mode in Google Maps (not just a route preview) — this is
    // the one that actually starts talking. mode=d = driving.
    const navIntent = `google.navigation:q=${latitude},${longitude}&mode=d`;
    try {
      if (await Linking.canOpenURL(navIntent)) {
        await Linking.openURL(navIntent);
        return true;
      }
    } catch (err) {
      console.warn(`${LOG_PREFIX} google.navigation intent failed:`, err);
    }
    // No Google Maps app (rare, but possible on some devices/ROMs) — the
    // web Directions URL still opens turn-by-turn-capable driving
    // directions in whatever's available (Maps app or browser).
    try {
      await Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
      );
      return true;
    } catch (err) {
      console.warn(`${LOG_PREFIX} web directions fallback failed:`, err);
      return false;
    }
  }

  // iOS: prefer Google Maps if the partner has it installed (same app
  // most are already used to for the in-app map), fall back to Apple
  // Maps, which is guaranteed to be present on every iPhone.
  try {
    const googleUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
    if (await Linking.canOpenURL(googleUrl)) {
      await Linking.openURL(googleUrl);
      return true;
    }
  } catch (err) {
    console.warn(`${LOG_PREFIX} comgooglemaps scheme check failed:`, err);
  }

  try {
    await Linking.openURL(`maps://app?daddr=${latitude},${longitude}&dirflg=d`);
    return true;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Apple Maps fallback failed:`, err);
    return false;
  }
}
