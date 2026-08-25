import { PendingRide } from '../services/api/ridesService';

// The only routes Splash ever hands off to — kept as a narrow union so
// LanguageSelectScreen's nextRoute param can't drift to a route that
// needs params of its own (e.g. TripDetail, DocumentDetail).
export type SplashDestination =
  | 'Onboarding1'
  | 'Login'
  | 'MainTabs'
  | 'TermsUpdate'
  | 'ApplicationProcessing'
  | 'BasicDetails';

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelect: { nextRoute: SplashDestination };
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Login: undefined;
  TermsUpdate: undefined;
  BuyCredit: undefined;
  Payment: {
    planId: string;
    planName: string;
    planTime: number;
    planRate: string;
  };
  BasicDetails: undefined;
  PartnerDocuments: undefined;
  ApplicationProcessing: undefined;
  Permissions: undefined;
  Verification: undefined;
  MainTabs: undefined;
  Vehicle: undefined;
  Wallet: undefined;
  TripDetail: { tripId: string; createdDate?: string; createdTime?: string };
  Settings: undefined;
  SOS: undefined;
  Logout: undefined;
  Documents: undefined;
  DocumentDetail: { docId: string };
  // Optional only so navigation.navigate('RideRequest') without params
  // doesn't error at the type level — RideRequestScreen requires at least
  // one ride and bails straight back to MainTabs if it's missing. This is
  // just the initial snapshot HomeScreen already had polled — the screen
  // runs its own live useRidePolling once mounted, so the list keeps
  // updating on its own after that.
  RideRequest: { rides: PendingRide[] } | undefined;
  // Carries the AcceptRide response forward so PickupNav can eventually
  // read pickup coords/polyline for real navigation — PickupNavScreen
  // itself hasn't been wired to use it yet (still mock), this just avoids
  // the data getting dropped on the floor between screens.
  PickupNav: { ride?: PendingRide } | undefined;
  Arrived: { ride?: PendingRide } | undefined;
  LiveTrip: { ride?: PendingRide } | undefined;
  // Carries the real CompleteRide response forward — fare/fareText are the
  // confirmed final fare from that call; ride is the same trip context
  // threaded through since CompleteRide's own response doesn't repeat
  // Pickup/Route/TripDistanceKM/TripDurationMinutes.
  TripEarnings:
    | { ride?: PendingRide; fare?: string; fareText?: string }
    | undefined;
  PassengerRating: undefined;
};
