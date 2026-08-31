import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import LocateIcon from '../../assets/icons/LocateIcon';
import CashIcon from '../../assets/icons/CashIcon';
import TaxiIcon from '../../assets/icons/TaxiIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import StarIcon from '../../assets/icons/StarIcon';
import CarIcon from '../../assets/icons/CarIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import {
  PARTNER_PROFILE,
  PARTNER_STATS,
  PARTNER_DEMAND_ZONES,
  PARTNER_INCENTIVES,
  PARTNER_VEHICLES,
} from './mockHomeData';
import { useRidePollingContext } from '../../contexts/RidePollingContext';
import { useUser } from '../../contexts/UserContext';
import { getInitials, getGreeting } from '../../utils/profileFormat';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';
import { getCookie } from '../../utils/session';
import {
  refreshActiveCreditFromServer,
  formatTimeLeft,
  ActiveCredit,
} from '../../utils/credit';
import {
  getPartnerOnOffStatus,
  setPartnerOnOffStatus,
  getPartnerPlanHistory,
  PartnerPlanHistoryItem,
} from '../../services/api/plansService';
import {
  getRideHistory,
  RideHistoryItem,
} from '../../services/api/ridesService';
import {
  getPartnerHome,
  PartnerHomeResponse,
} from '../../services/api/homeService';
import {
  getCachedRideHistory,
  setCachedRideHistory,
} from '../../utils/rideHistoryCache';
import { summarize, todayRange } from '../../utils/financeCalc';
import {
  useLiveLocationTracker,
  checkLocationReady,
  openLocationSettings,
  LocationUnreadyReason,
} from '../../utils/locationTracker';
import LocationStatusModal from '../../components/common/LocationStatusModal';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Mirrors TripHistoryScreen's isCompletedStatus — GetRideHistory is only
// confirmed to return COMPLETED so far, everything else (CANCELLED,
// REJECTED, etc.) is treated as not-completed for the amount colour/label.
const isCompletedStatus = (status: string) =>
  status?.toUpperCase() === 'COMPLETED';

// Maps PartnerHome's HotZones[].DemandLevel to the same tag text/dot colour
// the mock zone cards used (HIGH DEMAND=red, SURGE=orange, else STEADY=
// green) — DemandLevel values confirmed so far are "NORMAL", but the
// mapping is written defensively for HIGH/SURGE since those are the
// values the design's mock data implies the backend will eventually send.
const zoneTagStyle = (demandLevel?: string): { tag: string; dot: string } => {
  const level = (demandLevel || '').toUpperCase();
  if (level.includes('HIGH')) return { tag: 'HIGH DEMAND', dot: '#E0524E' };
  if (level.includes('SURGE')) return { tag: 'SURGE', dot: '#F2A03D' };
  return { tag: 'STEADY', dot: '#1F9D6B' };
};

const HomeScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { profile } = useUser();

  const [now, setNow] = useState(Date.now());
  const [online, setOnline] = useState(false);
  const [onOffBusy, setOnOffBusy] = useState(false);
  const [onOffError, setOnOffError] = useState<string | null>(null);
  const [creditInfo, setCreditInfo] = useState<ActiveCredit | null>(null);
  const creditTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real ride list + plan purchase history — Income = sum(ride list),
  // Expense = sum(plan history), Earnings = Income - Expense. See
  // utils/financeCalc.ts for the shared definition used here and on
  // EarningsScreen.
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [planHistory, setPlanHistory] = useState<PartnerPlanHistoryItem[]>([]);
  const [financeLoading, setFinanceLoading] = useState(true);

  // PartnerHome — server-computed Today/ThisWeek/ThisMonth stat blocks
  // (Earnings, TripsCompleted, OnlineMinutes, Rating). Backs the "Earned /
  // Completed / Online / Rating" stat cards below; Income/Expense split
  // still comes from rides+planHistory via financeCalc since PartnerHome
  // only returns the net Earnings figure.
  const [homeData, setHomeData] = useState<PartnerHomeResponse | null>(null);

  const loadFinancials = useCallback(async () => {
    try {
      const cookie = await getCookie();
      if (!cookie) return;
      const [ridesRes, planRes, homeRes] = await Promise.all([
        getRideHistory(cookie).catch(() => null),
        getPartnerPlanHistory(cookie).catch(() => null),
        getPartnerHome(cookie).catch(() => null),
      ]);
      if (ridesRes && ridesRes.Result === 'Success' && ridesRes.Rides) {
        setRides(ridesRes.Rides);
        setCachedRideHistory(ridesRes.Rides);
      }
      if (planRes && planRes.Result === 'Success' && planRes.History) {
        setPlanHistory(planRes.History);
      }
      if (homeRes && homeRes.Result === 'Success') {
        setHomeData(homeRes);
      }
    } catch (err) {
      console.warn('[HomeScreen] loadFinancials failed:', err);
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  // Cache-first seed on mount — paints Today's numbers and Recent trips
  // immediately from the last-known list (shared with TripHistoryScreen
  // and EarningsScreen), while loadFinancials still runs via the focus
  // effect below to revalidate against the server.
  useEffect(() => {
    (async () => {
      const cached = await getCachedRideHistory();
      if (cached && cached.length > 0) {
        setRides(cached);
        setFinanceLoading(false);
      }
    })();
  }, []);

  const todaySummary = useMemo(
    () => summarize(rides, planHistory, todayRange(now)),
    [rides, planHistory, now],
  );

  // Polls GetPendingRides every few seconds while online — see
  // contexts/RidePollingContext.tsx. This is a *shared* instance (also
  // used by RideRequestScreen) rather than a hook called locally here, so
  // there's only ever one source of truth for what's currently pending —
  // see that file's comment for why that matters. HomeScreen just tells
  // the shared poller when to turn on/off based on its own online state.
  const { incomingRides, setPollingEnabled } = useRidePollingContext();
  useEffect(() => {
    setPollingEnabled(online);
  }, [online, setPollingEnabled]);
  // RideTrans that have already triggered a hand-off into RideRequestScreen
  // this online session — without this, every single poll tick (~6s) would
  // re-navigate the partner back into that screen even after they'd
  // already seen and backed out of the exact same offer(s).
  const seenRideTransRef = useRef<Set<string>>(new Set());
  // HomeScreen stays mounted in the background for as long as any screen
  // pushed on top of MainTabs (RideRequest, PickupNav, Arrived, LiveTrip,
  // TripEarnings) is open — this poller keeps ticking the whole time. Without
  // this focus check, a new offer arriving while the partner is mid-trip or
  // sitting on the post-ride rating screen would silently yank them onto
  // RideRequestScreen out from under whatever they were doing, and from
  // there straight to MainTabs the moment that offer expired — looking like
  // the current screen "auto-closes" a few seconds in for no reason.
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!online) {
      seenRideTransRef.current.clear();
      return;
    }
    if (!isFocused) return;
    if (incomingRides.length === 0) return;
    const hasNewOffer = incomingRides.some(
      r => !seenRideTransRef.current.has(r.RideTran),
    );
    if (!hasNewOffer) return;
    incomingRides.forEach(r => seenRideTransRef.current.add(r.RideTran));
    navigation.navigate('RideRequest', { rides: incomingRides });
  }, [online, isFocused, incomingRides, navigation]);

  const [locationPrompt, setLocationPrompt] = useState<{
    title: string;
    message: string;
    reason?: LocationUnreadyReason;
  } | null>(null);

  // Shared by every path that takes the partner offline — manual toggle,
  // credit running out (refreshCredit below), or location becoming
  // unavailable (useLiveLocationTracker below) — so none of them leave a
  // stale ride-request timer/popup behind. Doesn't touch creditInfo: the
  // credit window itself is unaffected by online/offline, only the ride
  // pipeline and location tracker are.
  const goOffline = useCallback(() => {
    setOnline(false);

    // Best-effort server sync — going offline is a fail-safe local state
    // (same as the location-unavailable path above), so a network hiccup
    // here shouldn't stop the UI from showing "Offline" immediately. If
    // this fails the next PartnerOnOffGet poll/app open will just re-sync.
    getCookie()
      .then(cookie => {
        if (!cookie) return;
        return setPartnerOnOffStatus(cookie, 'OFF');
      })
      .catch(err =>
        console.warn('[HomeScreen] PartnerOnOffUpdate(OFF) failed:', err),
      );
  }, []);

  // Sends a PartnerLocationUpdate ping every ~20s for as long as `online`
  // is true, and stops automatically the moment it flips back to false
  // (going offline, or credit running out — see refreshCredit below).
  // If Location gets switched off (or permission revoked) while online,
  // onLocationUnavailable forces the partner back offline and tells them
  // why — the app can't stop the OS toggle from being flipped, only react.
  useLiveLocationTracker(online, {
    onLocationUnavailable: result => {
      goOffline();
      setLocationPrompt({
        title: 'You\u2019ve been set offline',
        message:
          result.message ||
          'Location is unavailable. Please turn on Location and go online again.',
        reason: result.reason,
      });
    },
  });

  // Real ActiveVehicle from PartnerHome when the partner has one on file;
  // falls back to the PARTNER_VEHICLES mock (color/year aren't in the API
  // response, so those two always come from the mock either way).
  const apiVehicle =
    homeData?.ActiveVehicle?.VehicleAvailable === 'YES'
      ? homeData.ActiveVehicle
      : null;
  const mockVehicle = PARTNER_VEHICLES[0];
  const vehicle = {
    number: apiVehicle?.VehicleRegistration || mockVehicle.number,
    type: apiVehicle?.VehicleType || mockVehicle.type,
    model: apiVehicle?.VehicleModel || mockVehicle.model,
    color: mockVehicle.color,
    year: mockVehicle.year,
    verified: apiVehicle ? apiVehicle.Verified === 'YES' : true,
  };
  const incentive = PARTNER_INCENTIVES[0];

  const refreshCredit = useCallback(async () => {
    const cookie = await getCookie();
    // Server-truth check via PartnerActivePlan, falling back to local
    // storage on any API failure — see refreshActiveCreditFromServer's
    // doc comment in utils/credit.ts for the field-name caveat.
    const active = await refreshActiveCreditFromServer(cookie);
    setCreditInfo(active);
    // Credit window ran out — can't stay online without active credit.
    setOnline(prevOnline => {
      if (prevOnline && !active) {
        return false;
      }
      return prevOnline;
    });
  }, []);

  // Pulls the server's current ON/OFF state so the toggle reflects reality
  // on app open / returning to Home (e.g. partner went online on another
  // device, or a previous PartnerOnOffUpdate(OFF) that failed silently in
  // goOffline actually did land server-side). Best-effort — on failure we
  // just keep whatever the local state already is.
  const syncOnOffStatus = useCallback(async () => {
    try {
      const cookie = await getCookie();
      if (!cookie) return;
      const res = await getPartnerOnOffStatus(cookie);
      if (res.Result === 'Success' && res.OnOff) {
        setOnline(res.OnOff === 'ON');
      }
    } catch (err) {
      console.warn('[HomeScreen] PartnerOnOffGet failed:', err);
    }
  }, []);

  // Re-check whenever Home regains focus (e.g. coming back from BuyCredit,
  // or after completing a ride) so credit, on/off state, and the
  // Income/Expense/Earnings numbers all reflect the latest server data.
  useFocusEffect(
    useCallback(() => {
      refreshCredit();
      syncOnOffStatus();
      loadFinancials();
    }, [refreshCredit, syncOnOffStatus, loadFinancials]),
  );

  // Server-truth re-check every 30s while Home is mounted — this is the
  // "is the plan still actually valid" poll, separate from the display.
  // Financials refresh on the same cadence so a just-completed ride or
  // just-purchased plan shows up on Home without needing to leave/return.
  useEffect(() => {
    creditTickRef.current = setInterval(() => {
      refreshCredit();
      loadFinancials();
    }, 30000);
    return () => {
      if (creditTickRef.current) clearInterval(creditTickRef.current);
    };
  }, [refreshCredit, loadFinancials]);

  // Purely local 1s tick so the "time left" text counts down smoothly
  // instead of sitting frozen between the 30s server polls above and
  // then jumping. No network call — just forces a re-render so
  // creditMsLeft (derived from creditInfo.expiresAt) stays current.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const creditMsLeft = creditInfo ? Math.max(0, creditInfo.expiresAt - now) : 0;

  // Real partner details from VerifyCookie (UserContext), falling back to
  // the PARTNER_PROFILE mock only if the profile hasn't loaded yet (e.g.
  // first-ever launch before Splash's VerifyCookie call resolves).
  const displayName = profile?.name || PARTNER_PROFILE.name;
  const initials = getInitials(profile?.name) || PARTNER_PROFILE.initials;
  // `now` already ticks every second above, so the greeting flips over
  // live (e.g. right at 12:00) without a separate interval.
  const greeting = getGreeting(new Date(now));

  // If the local countdown hits zero before the next scheduled server
  // poll, resync right away instead of showing "0s" for up to 30s.
  useEffect(() => {
    if (creditInfo && creditMsLeft <= 0) {
      refreshCredit();
    }
  }, [creditMsLeft, creditInfo, refreshCredit]);

  useEffect(() => {
    if (!onOffError) return;
    const timer = setTimeout(() => setOnOffError(null), 5000);
    return () => clearTimeout(timer);
  }, [onOffError]);

  const handleToggleOnline = async () => {
    if (onOffBusy) return;

    if (online) {
      // Manual "go offline" — credit itself is untouched, it's a
      // purchased wall-clock window (see utils/credit.ts) and keeps
      // counting down whether the partner is online or offline, same as
      // a prepaid rental. Only the ride pipeline/location tracker stop.
      goOffline();
      return;
    }

    const locationStatus = await checkLocationReady();
    if (!locationStatus.ready) {
      setLocationPrompt({
        title: 'Turn on Location',
        message:
          locationStatus.message || 'Please enable Location to go online.',
        reason: locationStatus.reason,
      });
      return;
    }

    const cookie = await getCookie();
    const active = await refreshActiveCreditFromServer(cookie);
    setCreditInfo(active);
    if (!active) {
      // No active credit — send them to buy one before they can go online.
      navigation.navigate('BuyCredit');
      return;
    }

    setOnOffError(null);
    setOnOffBusy(true);
    try {
      if (!cookie) throw new Error('Session not found. Please log in again.');
      const res = await setPartnerOnOffStatus(cookie, 'ON');
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Could not go online right now.');
      }
      setOnline(true);
    } catch (err: any) {
      setOnOffError(err?.message || 'Could not go online right now.');
    } finally {
      setOnOffBusy(false);
    }
  };

  // Most recent 3 rides for the "Recent trips" card — same data source
  // (GetRideHistory) that today's Income/Expense/Earnings is computed
  // from, just unfiltered by date so the card isn't empty outside of
  // today's rides.
  const recentTrips = rides.slice(0, 3);

  return (
    <View style={styles.container}>
      <TopSafeStrap backgroundColor={Colors.bg} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('AccountTab')}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: online
                  ? 'rgba(31,157,107,0.12)'
                  : 'rgba(15,17,21,0.06)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: online ? Colors.green : 'rgba(15,17,21,0.3)',
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: online ? Colors.green : Colors.mute },
              ]}
            >
              {online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Online toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleToggleOnline}
            activeOpacity={0.9}
            disabled={onOffBusy}
            style={[
              styles.onlineToggle,
              { backgroundColor: online ? Colors.green : Colors.ink },
              onOffBusy && styles.onlineToggleBusy,
            ]}
          >
            {onOffBusy ? (
              <Spinner size={20} color={online ? '#FFFFFF' : Colors.lime} />
            ) : (
              <View style={styles.onlineIconWrap}>
                <LocateIcon
                  size={20}
                  color={online ? '#FFFFFF' : Colors.lime}
                  strokeWidth={2}
                />
              </View>
            )}
            <Text
              style={[
                styles.onlineLabel,
                { color: online ? '#FFFFFF' : Colors.lime },
              ]}
            >
              {onOffBusy
                ? 'Going Online\u2026'
                : online
                ? 'You are Online'
                : 'Go Online'}
            </Text>
            {online && !onOffBusy && (
              <Text style={styles.onlineSub}>Sector 62, Noida</Text>
            )}
          </TouchableOpacity>

          {!!onOffError && (
            <TouchableOpacity
              style={styles.onOffErrorRow}
              activeOpacity={0.7}
              onPress={() => setOnOffError(null)}
            >
              <Text style={styles.onOffErrorText}>{onOffError}</Text>
            </TouchableOpacity>
          )}

          {creditInfo ? (
            <View style={styles.creditRow}>
              <ClockIcon size={13} color={Colors.mute} strokeWidth={2} />
              <Text style={styles.creditRowText}>
                Credit active · {formatTimeLeft(creditMsLeft)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.creditRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('BuyCredit')}
            >
              <WalletIcon size={13} color={Colors.mute} strokeWidth={1.8} />
              <Text style={styles.creditRowText}>
                No active credit — tap to buy
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Today's stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Today</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: Colors.lime }]}
              >
                <CashIcon size={17} color={Colors.ink} strokeWidth={1.8} />
              </View>
              <Text style={styles.statCardValue}>
                {financeLoading
                  ? '—'
                  : `₹${Math.round(
                      homeData?.Today
                        ? parseFloat(homeData.Today.Earnings)
                        : todaySummary.earnings,
                    ).toLocaleString('en-IN')}`}
              </Text>
              <Text style={styles.statCardLabel}>Earned</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#E8F1FF' }]}
              >
                <TaxiIcon size={17} color={Colors.ink} strokeWidth={1.8} />
              </View>
              <Text style={styles.statCardValue}>
                {financeLoading
                  ? '—'
                  : `${
                      homeData?.Today?.TripsCompleted ?? todaySummary.tripCount
                    } trips`}
              </Text>
              <Text style={styles.statCardLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#FFF4D6' }]}
              >
                <ClockIcon size={17} color={Colors.ink} strokeWidth={1.8} />
              </View>
              <Text style={styles.statCardValue}>
                {financeLoading
                  ? '—'
                  : homeData?.Today?.OnlineDurationText ||
                    PARTNER_STATS.onlineHours}
              </Text>
              <Text style={styles.statCardLabel}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#FCE6E0' }]}
              >
                <StarIcon size={17} color={Colors.ink} strokeWidth={1.8} />
              </View>
              <Text style={styles.statCardValue}>
                {financeLoading
                  ? '—'
                  : homeData?.Today?.Rating || PARTNER_STATS.rating}
              </Text>
              <Text style={styles.statCardLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Demand zones */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Hot zones near you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zonesRow}
          >
            {(homeData?.HotZones && homeData.HotZones.length > 0
              ? homeData.HotZones.map(z => ({
                  name: z.AreaName,
                  ...zoneTagStyle(z.DemandLevel),
                }))
              : PARTNER_DEMAND_ZONES
            ).map(zone => (
              <View key={zone.name} style={styles.zoneCard}>
                <View style={styles.zoneTagRow}>
                  <View
                    style={[styles.zoneDot, { backgroundColor: zone.dot }]}
                  />
                  <Text style={[styles.zoneTag, { color: zone.dot }]}>
                    {zone.tag}
                  </Text>
                </View>
                <Text style={styles.zoneName}>{zone.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Active vehicle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.vehicleRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Vehicle')}
          >
            <View style={styles.vehicleIconWrap}>
              <CarIcon size={22} color={Colors.ink} strokeWidth={1.8} />
            </View>
            <View style={styles.vehicleTextWrap}>
              <Text style={styles.vehicleEyebrow}>Active vehicle</Text>
              <Text style={styles.vehicleNumber}>{vehicle.number}</Text>
              <Text style={styles.vehicleModel}>
                {vehicle.type} · {vehicle.model}
              </Text>
            </View>
            <View
              style={[
                styles.verifiedChip,
                !vehicle.verified && styles.unverifiedChip,
              ]}
            >
              <Text
                style={[
                  styles.verifiedText,
                  !vehicle.verified && styles.unverifiedText,
                ]}
              >
                {vehicle.verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Incentive card */}
        {incentive && (
          <View style={styles.section}>
            <View style={styles.incentiveCard}>
              <View style={styles.incentiveDecoration} />
              <Text style={styles.incentiveEyebrow}>Incentive</Text>
              <Text style={styles.incentiveTitle}>{incentive.title}</Text>
              <Text style={styles.incentiveSub}>{incentive.sub}</Text>
              <View style={styles.incentiveTrack}>
                <View
                  style={[
                    styles.incentiveFill,
                    {
                      width: `${(incentive.current / incentive.target) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.incentiveProgress}>
                {incentive.current} of {incentive.target} trips done
              </Text>
            </View>
          </View>
        )}

        {/* Today's Income / Expense / Earnings — replaces the old "Next
            payout" block. Same numbers that back the "Earned" stat card
            above, shown here with the Income/Expense split. */}
        <View style={styles.section}>
          <View style={styles.financeCard}>
            <Text style={styles.financeEyebrow}>Today's summary</Text>
            <View style={styles.financeRow}>
              <View style={styles.financeCol}>
                <Text style={styles.financeColLabel}>Income</Text>
                <Text style={styles.financeColValue}>
                  {financeLoading
                    ? '—'
                    : `₹${todaySummary.income.toLocaleString('en-IN')}`}
                </Text>
              </View>
              <View style={[styles.financeCol, styles.financeColDivider]}>
                <Text style={styles.financeColLabel}>Expense</Text>
                <Text style={[styles.financeColValue, { color: '#FF9B8A' }]}>
                  {financeLoading
                    ? '—'
                    : `₹${todaySummary.expense.toLocaleString('en-IN')}`}
                </Text>
              </View>
              <View style={styles.financeCol}>
                <Text style={styles.financeColLabel}>Earnings</Text>
                <Text style={[styles.financeColValue, { color: Colors.lime }]}>
                  {financeLoading
                    ? '—'
                    : `₹${todaySummary.earnings.toLocaleString('en-IN')}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent trips */}
        <View style={styles.section}>
          <View style={styles.tripsHeaderRow}>
            <Text style={styles.tripsHeaderLabel}>Recent trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TripsTab')}>
              <Text style={styles.tripsSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <Card pad={4}>
            {recentTrips.length === 0 ? (
              <View style={styles.emptyTrips}>
                <Text style={styles.emptyTripsText}>
                  {financeLoading ? 'Loading…' : 'No trips yet'}
                </Text>
              </View>
            ) : (
              recentTrips.map((trip, i) => {
                const completed = isCompletedStatus(trip.Status);
                return (
                  <TouchableOpacity
                    key={trip.RideTran}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('TripDetail', {
                        tripId: trip.RideTran,
                        createdDate: trip.CreatedDate,
                        createdTime: trip.CreatedTime,
                      })
                    }
                    style={[
                      styles.tripRow,
                      i < recentTrips.length - 1 && styles.tripRowDivider,
                    ]}
                  >
                    <View style={styles.tripIconWrap}>
                      <TaxiIcon
                        size={18}
                        color={Colors.ink}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={styles.tripTextWrap}>
                      <Text style={styles.tripRoute} numberOfLines={1}>
                        {trip.PickupAddress} → {trip.DropAddress}
                      </Text>
                      <Text style={styles.tripMeta}>
                        {trip.CreatedDate} · {trip.DistanceKM} km
                      </Text>
                    </View>
                    <View style={styles.tripAmountWrap}>
                      <Text
                        style={[
                          styles.tripEarning,
                          { color: completed ? Colors.ink : Colors.red },
                        ]}
                      >
                        ₹{trip.FinalFare}
                      </Text>
                      <Text
                        style={[
                          styles.tripStatus,
                          { color: completed ? Colors.green : Colors.red },
                        ]}
                      >
                        {trip.Status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </Card>
        </View>

        {/* Accept / cancellation rate */}
        <View style={[styles.section, styles.rateSection]}>
          <View style={styles.rateCard}>
            <View style={styles.rateHeaderRow}>
              <CheckIcon size={14} color={Colors.green} strokeWidth={2.2} />
              <Text style={styles.rateLabel}>Acceptance rate</Text>
            </View>
            <Text style={[styles.rateValue, { color: Colors.green }]}>
              {PARTNER_STATS.acceptanceRate}%
            </Text>
          </View>
          <View style={styles.rateCard}>
            <View style={styles.rateHeaderRow}>
              <CloseIcon size={14} color={Colors.red} strokeWidth={2} />
              <Text style={styles.rateLabel}>Cancellation rate</Text>
            </View>
            <Text style={[styles.rateValue, { color: Colors.red }]}>
              {PARTNER_STATS.cancellationRate}%
            </Text>
          </View>
        </View>
      </ScrollView>

      <LocationStatusModal
        visible={!!locationPrompt}
        title={locationPrompt?.title || ''}
        message={locationPrompt?.message || ''}
        primaryLabel="Open Settings"
        onPrimaryPress={() => {
          openLocationSettings(locationPrompt?.reason);
          setLocationPrompt(null);
        }}
        secondaryLabel="Not now"
        onSecondaryPress={() => setLocationPrompt(null)}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vscale(110),
  },
  header: {
    paddingTop: vscale(14),
    paddingBottom: vscale(14),
    paddingHorizontal: hscale(18),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  avatar: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(22),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fscale(15),
  },
  headerTextWrap: {
    flex: 1,
  },
  greeting: {
    fontSize: fscale(11),
    color: Colors.mute,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  name: {
    fontSize: fscale(17),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(5),
    paddingVertical: vscale(5),
    paddingHorizontal: hscale(10),
    borderRadius: 99,
  },
  statusDot: {
    width: hscale(7),
    height: hscale(7),
    borderRadius: hscale(4),
  },
  statusText: {
    fontSize: fscale(11.5),
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: hscale(18),
    marginTop: vscale(16),
  },
  onlineToggle: {
    width: '100%',
    height: vscale(60),
    borderRadius: hscale(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(12),
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  onlineToggleBusy: {
    opacity: 0.85,
  },
  onOffErrorRow: {
    marginTop: vscale(8),
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(224,82,78,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,82,78,0.25)',
  },
  onOffErrorText: {
    fontSize: fscale(11.5),
    fontWeight: '600',
    color: Colors.red,
    textAlign: 'center',
  },
  onlineIconWrap: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(18),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineLabel: {
    fontSize: fscale(17),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  onlineSub: {
    fontSize: fscale(12),
    color: 'rgba(255,255,255,0.65)',
  },
  creditRow: {
    marginTop: vscale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    paddingVertical: vscale(4),
  },
  creditRowText: {
    fontSize: fscale(12),
    fontWeight: '600',
    color: Colors.mute,
  },
  sectionLabel: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.mute,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: vscale(10),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hscale(10),
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: hscale(18),
    padding: hscale(14),
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  statIconWrap: {
    width: hscale(34),
    height: hscale(34),
    borderRadius: hscale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vscale(8),
  },
  statCardValue: {
    fontSize: fscale(18),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  statCardLabel: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '600',
    marginTop: vscale(1),
  },
  zonesRow: {
    flexDirection: 'row',
    gap: hscale(10),
    paddingBottom: vscale(4),
  },
  zoneCard: {
    minWidth: hscale(160),
    paddingVertical: vscale(12),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(18),
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  zoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    marginBottom: vscale(6),
  },
  zoneDot: {
    width: hscale(8),
    height: hscale(8),
    borderRadius: hscale(4),
  },
  zoneTag: {
    fontSize: fscale(11),
    fontWeight: '700',
  },
  zoneName: {
    fontSize: fscale(13),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(14),
    paddingHorizontal: hscale(16),
    backgroundColor: Colors.surface,
    borderRadius: hscale(18),
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  vehicleIconWrap: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(14),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTextWrap: {
    flex: 1,
  },
  vehicleEyebrow: {
    fontSize: fscale(11),
    color: Colors.mute,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  vehicleNumber: {
    fontSize: fscale(15),
    fontWeight: '700',
    color: Colors.ink,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  vehicleModel: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  verifiedChip: {
    paddingVertical: vscale(4),
    paddingHorizontal: hscale(8),
    borderRadius: hscale(8),
    backgroundColor: '#E9F8E4',
  },
  unverifiedChip: {
    backgroundColor: '#FBE7E5',
  },
  verifiedText: {
    color: Colors.green,
    fontSize: fscale(10.5),
    fontWeight: '700',
  },
  unverifiedText: {
    color: Colors.red,
  },
  incentiveCard: {
    borderRadius: hscale(22),
    paddingVertical: vscale(16),
    paddingHorizontal: hscale(18),
    backgroundColor: Colors.lime,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.lime,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
  incentiveDecoration: {
    position: 'absolute',
    top: hscale(-20),
    right: hscale(-20),
    width: hscale(100),
    height: hscale(100),
    borderRadius: hscale(50),
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  incentiveEyebrow: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.ink,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  incentiveTitle: {
    fontSize: fscale(18),
    fontWeight: '800',
    color: Colors.ink,
    marginTop: vscale(4),
    letterSpacing: -0.4,
  },
  incentiveSub: {
    fontSize: fscale(12.5),
    color: Colors.ink,
    opacity: 0.7,
    marginTop: vscale(2),
  },
  incentiveTrack: {
    marginTop: vscale(10),
    height: vscale(6),
    borderRadius: 3,
    backgroundColor: 'rgba(15,17,21,0.15)',
  },
  incentiveFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.ink,
  },
  incentiveProgress: {
    marginTop: vscale(4),
    fontSize: fscale(11),
    color: Colors.ink,
    opacity: 0.6,
  },
  financeCard: {
    paddingVertical: vscale(16),
    paddingHorizontal: hscale(16),
    backgroundColor: Colors.ink,
    borderRadius: hscale(18),
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  financeEyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: vscale(12),
  },
  financeRow: {
    flexDirection: 'row',
  },
  financeCol: {
    flex: 1,
  },
  financeColDivider: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: hscale(8),
  },
  financeColLabel: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginBottom: vscale(3),
  },
  financeColValue: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  tripsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: vscale(10),
  },
  tripsHeaderLabel: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tripsSeeAll: {
    fontSize: fscale(12),
    color: Colors.blue,
    fontWeight: '600',
  },
  emptyTrips: {
    paddingVertical: vscale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTripsText: {
    fontSize: fscale(12.5),
    color: Colors.mute,
    fontWeight: '600',
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(12),
  },
  tripRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  tripIconWrap: {
    width: hscale(38),
    height: hscale(38),
    borderRadius: hscale(12),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  tripRoute: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  tripMeta: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  tripAmountWrap: {
    alignItems: 'flex-end',
  },
  tripEarning: {
    fontSize: fscale(13.5),
    fontWeight: '700',
  },
  tripStatus: {
    fontSize: fscale(10.5),
    fontWeight: '600',
    marginTop: vscale(1),
  },
  rateSection: {
    flexDirection: 'row',
    gap: hscale(10),
  },
  rateCard: {
    flex: 1,
    paddingVertical: vscale(12),
    paddingHorizontal: hscale(14),
    backgroundColor: Colors.surface,
    borderRadius: hscale(18),
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  rateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    marginBottom: vscale(6),
  },
  rateLabel: {
    fontSize: fscale(11),
    fontWeight: '600',
    color: Colors.mute,
  },
  rateValue: {
    fontSize: fscale(20),
    fontWeight: '800',
  },
});
