// Central place for the Google Maps Platform key(s) so they're never
// duplicated across files — mirrors NCRide's own constants/mapsConfig.ts.
//
// The native Android Maps SDK key (com.google.android.geo.API_KEY in
// android/app/src/main/AndroidManifest.xml) is what actually renders the
// map itself — that lives in the native project, not here, and isn't
// referenced from JS at all; the Maps SDK reads it directly off the
// manifest. If NCRide Partner's manifest doesn't have that meta-data entry
// yet, LiveRouteMap.tsx will render a blank/grey map until it's added:
//
//   <meta-data
//     android:name="com.google.android.geo.API_KEY"
//     android:value="YOUR_KEY_HERE" />
//
// GOOGLE_MAPS_API_KEY below is used for plain JS fetch() calls — routing.ts
// calls the Directions API with it (the map itself is still rendered by
// the native SDK using the Android-manifest key, separately). It needs its
// OWN key restricted to "None" (application restrictions) + "Directions
// API" / "Places API (New)" only — reusing the Android-manifest key here
// will fail with API_KEY_ANDROID_APP_BLOCKED, since that key is restricted
// to native Android app calls, not unrestricted JS fetch() calls.
//
// TODO: replace with NCRide Partner's actual key(s). If this shares a
// Google Cloud project with NCRide, the manifest key can often just have
// this app's package name + SHA-1 added as an extra allowed Android app
// under the *same* key (Google Cloud Console → Credentials → that key →
// Android app restrictions) rather than provisioning a whole new key.
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAU4PPy7jML1IcDSHgwWjoZHm-AaIDt1JI';

// Places API (New) base URL — only relevant once/if GOOGLE_MAPS_API_KEY
// above is filled in and this app adds its own geocode.ts.
export const PLACES_API_BASE = 'https://places.googleapis.com/v1';

export const PLACES_REGION_CODE = 'in';
export const PLACES_LANGUAGE = 'en';
