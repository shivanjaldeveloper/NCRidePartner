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
  Payouts: undefined;
  Wallet: undefined;
  TripDetail: { tripId: string };
  Settings: undefined;
  SOS: undefined;
  Logout: undefined;
  Documents: undefined;
  DocumentDetail: { docId: string };
  RideRequest: undefined;
  PickupNav: undefined;
  Arrived: undefined;
  LiveTrip: undefined;
  TripEarnings: undefined;
  PassengerRating: undefined;
};
