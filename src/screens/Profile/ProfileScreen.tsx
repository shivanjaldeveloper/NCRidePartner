import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Row from '../../components/common/Row';
import RewardIcon from '../../assets/icons/RewardIcon';
import CarIcon from '../../assets/icons/CarIcon';
import UserIcon from '../../assets/icons/UserIcon';
import CashIcon from '../../assets/icons/CashIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import BellIcon from '../../assets/icons/BellIcon';
import SettingsIcon from '../../assets/icons/SettingsIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import LogoutIcon from '../../assets/icons/LogoutIcon';
import {
  PARTNER_PROFILE,
  PARTNER_STATS,
  PARTNER_VEHICLES,
} from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';
import { getCookie } from '../../utils/session';
import { useUser } from '../../contexts/UserContext';
import { getInitials, formatPhone } from '../../utils/profileFormat';
import {
  refreshActiveCreditFromServer,
  formatTimeLeft,
  ActiveCredit,
} from '../../utils/credit';
import {
  getPartnerPlanHistory,
  PartnerPlanHistoryItem,
} from '../../services/api/plansService';
import { getRideHistory } from '../../services/api/ridesService';
import {
  getPartnerHome,
  PartnerHomeActiveVehicle,
} from '../../services/api/homeService';
import {
  getCachedRideHistory,
  setCachedRideHistory,
} from '../../utils/rideHistoryCache';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'AccountTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const { profile } = useUser();
  // Real Name/Username from VerifyCookie (UserContext), falling back to the
  // PARTNER_PROFILE mock only if the profile hasn't loaded yet.
  const p = {
    name: profile?.name || PARTNER_PROFILE.name,
    initials: getInitials(profile?.name) || PARTNER_PROFILE.initials,
    phone: profile?.username
      ? formatPhone(profile.username)
      : PARTNER_PROFILE.phone,
  };
  const s = PARTNER_STATS;
  const mockVehicle = PARTNER_VEHICLES[0];

  const [activeCredit, setActiveCredit] = useState<ActiveCredit | null>(null);
  const [lastPurchase, setLastPurchase] =
    useState<PartnerPlanHistoryItem | null>(null);
  // Real total trip count from GetRideHistory — PARTNER_STATS.totalTrips
  // was removed since it was purely a mock number. null while loading so
  // the stat shows "—" instead of a misleading 0.
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  // Real ActiveVehicle from PartnerHome — backs the "Vehicle details" row's
  // subtitle below. null (falls back to the mock) until it loads or if the
  // partner has no vehicle on file.
  const [apiVehicle, setApiVehicle] = useState<PartnerHomeActiveVehicle | null>(
    null,
  );
  // Real rating from PartnerHome's Today block — PARTNER_STATS.rating was
  // a mock. null (falls back to the mock) until the fetch resolves.
  const [rating, setRating] = useState<string | null>(null);

  // On focus (e.g. after buying a plan and coming back here): pull
  // active-credit status and the most recent purchase off a single
  // cookie fetch, same pattern as HomeScreen/BuyCreditScreen so all
  // three screens always agree with each other and with the server.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const cookie = await getCookie();
        if (!cookie) return;

        const [active, historyRes, ridesRes, homeRes] = await Promise.all([
          refreshActiveCreditFromServer(cookie),
          getPartnerPlanHistory(cookie).catch(() => null),
          getRideHistory(cookie).catch(() => null),
          getPartnerHome(cookie).catch(() => null),
        ]);

        setActiveCredit(active);
        if (
          historyRes &&
          historyRes.Result === 'Success' &&
          historyRes.History?.length
        ) {
          setLastPurchase(historyRes.History[0]);
        }
        if (ridesRes && ridesRes.Result === 'Success' && ridesRes.Rides) {
          setTripCount(ridesRes.Rides.length);
          setCachedRideHistory(ridesRes.Rides);
        }
        if (homeRes && homeRes.Result === 'Success') {
          if (homeRes.ActiveVehicle?.VehicleAvailable === 'YES') {
            setApiVehicle(homeRes.ActiveVehicle);
          }
          if (homeRes.Today?.Rating) {
            setRating(homeRes.Today.Rating);
          }
        }
      })();
    }, []),
  );

  // Cache-first seed on mount — shows a real trip count immediately
  // (shared cache with Home/Earnings/Trips) instead of "—" until the
  // focus effect above's fetch resolves.
  useEffect(() => {
    (async () => {
      const cached = await getCachedRideHistory();
      if (cached && cached.length > 0) {
        setTripCount(cached.length);
      }
    })();
  }, []);

  // Purely local 1s tick so the countdown reads smoothly here too,
  // instead of only refreshing whenever this screen happens to refocus.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const activeMsLeft = activeCredit
    ? Math.max(0, activeCredit.expiresAt - now)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        <View style={styles.body}>
          <Card pad={16}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{p.initials}</Text>
              </View>
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileName}>{p.name}</Text>
                <Text style={styles.profilePhone}>{p.phone}</Text>
                <View style={styles.goldBadge}>
                  <RewardIcon size={12} color={Colors.lime} strokeWidth={1.8} />
                  <Text style={styles.goldBadgeText}>
                    {t('profile.goldPartner')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                {
                  v: rating ?? s.rating,
                  l: 'rating',
                  labelKey: 'profile.stats.rating',
                },
                {
                  v:
                    tripCount === null
                      ? '—'
                      : tripCount.toLocaleString('en-IN'),
                  l: 'trips',
                  labelKey: 'profile.stats.trips',
                },
                {
                  v: `${s.acceptanceRate}%`,
                  l: 'acceptance',
                  labelKey: 'profile.stats.acceptance',
                },
              ].map((item, i) => (
                <View
                  key={item.l}
                  style={[styles.statItem, i > 0 && styles.statItemBorder]}
                >
                  <Text style={styles.statValue}>{item.v}</Text>
                  <Text style={styles.statLabel}>{t(item.labelKey)}</Text>
                </View>
              ))}
            </View>
          </Card>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BuyCredit')}
          >
            <Card pad={16} style={styles.plansCard}>
              <View style={styles.plansRow}>
                <View
                  style={[
                    styles.plansIconWrap,
                    activeCredit && styles.plansIconWrapActive,
                  ]}
                >
                  {activeCredit ? (
                    <ClockIcon size={18} color="#FFFFFF" strokeWidth={2} />
                  ) : (
                    <WalletIcon
                      size={18}
                      color={Colors.ink}
                      strokeWidth={1.8}
                    />
                  )}
                </View>
                <View style={styles.plansTextWrap}>
                  <Text style={styles.plansTitle}>
                    {t('profile.plans.title')}
                  </Text>
                  <Text style={styles.plansSub}>
                    {activeCredit
                      ? t('profile.plans.activeSub', {
                          timeLeft: formatTimeLeft(activeMsLeft),
                        })
                      : lastPurchase
                      ? t('profile.plans.lastPurchaseSub', {
                          plan: lastPurchase.PlanName,
                          date: lastPurchase.PlanStartDate,
                        })
                      : t('profile.plans.noActiveSub')}
                  </Text>
                </View>
                {activeCredit && (
                  <View style={styles.plansActiveBadge}>
                    <Text style={styles.plansActiveBadgeText}>
                      {t('profile.plans.activeBadge')}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>

          <Card pad={4} style={styles.groupCard}>
            <Row
              icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('profile.rows.vehicleDetails')}
              sub={
                apiVehicle
                  ? `${apiVehicle.VehicleRegistration} · ${apiVehicle.VehicleType}`
                  : `${mockVehicle.number} · ${mockVehicle.type}`
              }
              onPress={() => navigation.navigate('Vehicle')}
              showDivider
            />
            <Row
              icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('profile.rows.documents')}
              sub={t('profile.allVerified')}
              onPress={() => navigation.navigate('Documents')}
              showDivider
            />
            <Row
              icon={<CashIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('profile.rows.earnings')}
              sub={t('profile.earningsSub', { amount: '₹72,800' })}
              onPress={() => navigation.navigate('EarningsTab')}
            />
          </Card>

          <Card pad={4} style={styles.groupCard}>
            <Row
              icon={<BellIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('profile.rows.notifications')}
              sub={t('profile.notificationsSub')}
              onPress={() => navigation.navigate('Settings')}
              showDivider
            />
            <Row
              icon={
                <SettingsIcon size={18} color={Colors.ink} strokeWidth={1.8} />
              }
              title={t('profile.rows.appSettings')}
              sub={t('profile.appSettingsSub')}
              onPress={() => navigation.navigate('Settings')}
              showDivider
            />
            <Row
              icon={<ChatIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('profile.rows.helpSupport')}
              onPress={() => navigation.navigate('SupportTab')}
              showDivider
            />
            <Row
              icon={
                <LogoutIcon size={18} color={Colors.red} strokeWidth={1.8} />
              }
              title={t('profile.rows.logOut')}
              danger
              onPress={() => navigation.navigate('Logout')}
            />
          </Card>

          <Text style={styles.footerText}>{t('profile.footer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vscale(30),
  },
  header: {
    paddingTop: vscale(45),
    paddingHorizontal: hscale(18),
  },
  title: {
    fontSize: fscale(28),
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.ink,
  },
  body: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(14),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(14),
  },
  avatar: {
    width: hscale(64),
    height: hscale(64),
    borderRadius: hscale(32),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fscale(22),
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: fscale(18),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  profilePhone: {
    fontSize: fscale(12.5),
    color: Colors.mute,
  },
  goldBadge: {
    marginTop: vscale(6),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(5),
    paddingVertical: vscale(3),
    paddingHorizontal: hscale(8),
    borderRadius: 99,
    backgroundColor: Colors.ink,
  },
  goldBadgeText: {
    color: Colors.lime,
    fontSize: fscale(10.5),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: vscale(14),
    paddingTop: vscale(12),
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemBorder: {
    borderLeftWidth: 0.5,
    borderLeftColor: Colors.line,
  },
  statValue: {
    fontSize: fscale(18),
    fontWeight: '800',
    color: Colors.ink,
  },
  statLabel: {
    fontSize: fscale(10.5),
    color: Colors.mute,
    fontWeight: '600',
    marginTop: vscale(1),
  },
  plansCard: {
    marginTop: vscale(12),
  },
  plansRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  plansIconWrap: {
    width: hscale(38),
    height: hscale(38),
    borderRadius: hscale(13),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plansIconWrapActive: {
    backgroundColor: Colors.green,
  },
  plansTextWrap: {
    flex: 1,
  },
  plansTitle: {
    fontSize: fscale(14.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  plansSub: {
    fontSize: fscale(12),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  plansActiveBadge: {
    paddingVertical: vscale(3),
    paddingHorizontal: hscale(8),
    borderRadius: hscale(6),
    backgroundColor: '#E9F8E4',
  },
  plansActiveBadgeText: {
    fontSize: fscale(9.5),
    fontWeight: '700',
    color: Colors.green,
  },
  groupCard: {
    marginTop: vscale(12),
  },
  footerText: {
    marginTop: vscale(16),
    textAlign: 'center',
    fontSize: fscale(11),
    color: Colors.mute2,
  },
});
