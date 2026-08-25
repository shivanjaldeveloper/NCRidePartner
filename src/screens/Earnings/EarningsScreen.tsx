import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import CashIcon from '../../assets/icons/CashIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';
import { getCookie } from '../../utils/session';
import {
  getRideHistory,
  RideHistoryItem,
} from '../../services/api/ridesService';
import {
  getCachedRideHistory,
  setCachedRideHistory,
} from '../../utils/rideHistoryCache';
import {
  getPartnerPlanHistory,
  PartnerPlanHistoryItem,
} from '../../services/api/plansService';
import {
  getPartnerHome,
  PartnerHomeResponse,
} from '../../services/api/homeService';
import {
  summarize,
  todayRange,
  weekRange,
  monthRange,
  parseDdMmYyyyHms,
  ridesInRange,
  FinancialSummary,
} from '../../utils/financeCalc';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'EarningsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type EarningsTab = 'today' | 'week' | 'month';

const TAB_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EarningsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [tab, setTab] = useState<EarningsTab>('today');

  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [planHistory, setPlanHistory] = useState<PartnerPlanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PartnerHome — server-computed Today/ThisWeek/ThisMonth Earnings +
  // TripsCompleted. Backs the headline amount/trip-count on each tab below;
  // the Income/Expense breakdown strip and the week's daily chart still use
  // rides+planHistory via financeCalc, since PartnerHome doesn't break
  // earnings down that far.
  const [homeData, setHomeData] = useState<PartnerHomeResponse | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        if (!silent) setError('Session not found. Please log in again.');
        return;
      }
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
      if (
        (!ridesRes || ridesRes.Result !== 'Success') &&
        (!planRes || planRes.Result !== 'Success')
      ) {
        if (!silent) setError('Could not load earnings right now.');
      }
    } catch (err: any) {
      if (!silent)
        setError(err?.message || 'Could not load earnings right now.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const cached = await getCachedRideHistory();
      if (cached && cached.length > 0) {
        setRides(cached);
        setLoading(false);
        loadData(true);
      } else {
        loadData();
      }
    })();
    // Only run once on mount — loadData is stable, refetching on refocus
    // is handled by the focus effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent refetch on refocus (e.g. after completing a ride or buying a
  // plan) so the numbers stay current without flashing a loader every time.
  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData]),
  );

  const todaySummary = useMemo(
    () => summarize(rides, planHistory, todayRange()),
    [rides, planHistory],
  );
  const weekSummary = useMemo(
    () => summarize(rides, planHistory, weekRange()),
    [rides, planHistory],
  );
  const monthSummary = useMemo(
    () => summarize(rides, planHistory, monthRange()),
    [rides, planHistory],
  );

  // Per-weekday income + trip count for the week chart/daily breakdown —
  // grouped from the same ride list weekSummary is built from.
  const weekDays = useMemo(() => {
    const range = weekRange();
    const ridesThisWeek = ridesInRange(rides, range);
    const buckets = WEEKDAY_LABELS.map(label => ({
      day: label,
      amount: 0,
      trips: 0,
    }));
    ridesThisWeek.forEach(r => {
      const ms = parseDdMmYyyyHms(r.CreatedDate, r.CreatedTime);
      if (ms === null) return;
      const jsDay = new Date(ms).getDay(); // 0 = Sun ... 6 = Sat
      const idx = jsDay === 0 ? 6 : jsDay - 1; // Mon-first index
      const fare = parseFloat(r.FinalFare);
      buckets[idx].amount += Number.isFinite(fare) ? fare : 0;
      buckets[idx].trips += 1;
    });
    return buckets;
  }, [rides]);

  const maxDay = Math.max(...weekDays.map(d => d.amount), 1);
  const todayLabel =
    WEEKDAY_LABELS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const goToWallet = () => navigation.navigate('Wallet');

  const renderSummaryStrip = (s: FinancialSummary) => (
    <Card style={styles.breakdownCard} pad={16}>
      <Text style={styles.breakdownLabel}>Summary</Text>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownKey}>Income</Text>
        <Text style={styles.breakdownValue}>
          ₹{s.income.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.breakdownRow}>
        <Text style={[styles.breakdownKey, { color: Colors.red }]}>
          Expense (plans)
        </Text>
        <Text style={[styles.breakdownValue, { color: Colors.red }]}>
          −₹{s.expense.toLocaleString('en-IN')}
        </Text>
      </View>
      <View style={styles.breakdownTotal}>
        <Text style={styles.breakdownTotalLabel}>Net earnings</Text>
        <Text style={styles.breakdownTotalValue}>
          ₹{s.earnings.toLocaleString('en-IN')}
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>
            Track your income from Alo Alo Partner
          </Text>
        </View>

        <View style={styles.tabsWrap}>
          <SegmentedTabs
            options={TAB_OPTIONS}
            value={tab}
            onChange={id => setTab(id as EarningsTab)}
          />
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateText}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity
              onPress={() => loadData()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {tab === 'today' && (
              <View style={styles.body}>
                <Card pad={20} style={styles.darkCard}>
                  <View style={styles.darkCardRow}>
                    <View>
                      <Text style={styles.darkEyebrow}>Today's earnings</Text>
                      <Text style={styles.darkAmount}>
                        ₹
                        {Math.round(
                          homeData?.Today
                            ? parseFloat(homeData.Today.Earnings)
                            : todaySummary.earnings,
                        ).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.darkIconWrap}>
                      <CashIcon
                        size={22}
                        color={Colors.lime}
                        strokeWidth={1.8}
                      />
                    </View>
                  </View>
                  <View style={styles.darkMetaRow}>
                    <Text style={styles.darkMetaText}>
                      <Text style={styles.darkMetaStrong}>
                        {homeData?.Today?.TripsCompleted ??
                          todaySummary.tripCount}
                      </Text>{' '}
                      trips
                    </Text>
                  </View>
                </Card>

                {renderSummaryStrip(todaySummary)}

                <TouchableOpacity
                  style={styles.primaryButtonFull}
                  onPress={goToWallet}
                >
                  <WalletIcon size={17} color={Colors.lime} strokeWidth={1.8} />
                  <Text style={styles.primaryButtonLabel}>Wallet</Text>
                </TouchableOpacity>
              </View>
            )}

            {tab === 'week' && (
              <View style={styles.body}>
                <Card pad={16}>
                  <Text style={styles.breakdownLabel}>This week</Text>
                  <Text style={styles.weekAmount}>
                    ₹
                    {Math.round(
                      homeData?.ThisWeek
                        ? parseFloat(homeData.ThisWeek.Earnings)
                        : weekSummary.earnings,
                    ).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.weekMeta}>
                    {homeData?.ThisWeek?.TripsCompleted ??
                      weekSummary.tripCount}{' '}
                    trips · Mon–Sun
                  </Text>

                  <View style={styles.chartRow}>
                    {weekDays.map(d => (
                      <View key={d.day} style={styles.chartBarWrap}>
                        <Text style={styles.chartValue}>
                          ₹{Math.round(d.amount / 1000)}k
                        </Text>
                        <View
                          style={[
                            styles.chartBar,
                            {
                              height: vscale((d.amount / maxDay) * 68),
                              backgroundColor:
                                d.day === todayLabel
                                  ? Colors.ink
                                  : 'rgba(15,17,21,0.12)',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.chartDay,
                            {
                              color:
                                d.day === todayLabel ? Colors.ink : Colors.mute,
                              fontWeight: d.day === todayLabel ? '700' : '500',
                            },
                          ]}
                        >
                          {d.day}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>

                <Card pad={4} style={styles.dailyCard}>
                  <Text style={styles.dailyHeader}>Daily breakdown</Text>
                  {weekDays.map((d, i) => (
                    <View
                      key={d.day}
                      style={[styles.dailyRow, i > 0 && styles.dailyRowBorder]}
                    >
                      <View
                        style={[
                          styles.dailyBadge,
                          {
                            backgroundColor:
                              d.day === todayLabel ? Colors.ink : Colors.bg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dailyBadgeText,
                            {
                              color:
                                d.day === todayLabel
                                  ? Colors.lime
                                  : Colors.mute,
                            },
                          ]}
                        >
                          {d.day}
                        </Text>
                      </View>
                      <Text style={styles.dailyTrips}>{d.trips} trips</Text>
                      <Text style={styles.dailyAmount}>
                        ₹{d.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))}
                </Card>

                {renderSummaryStrip(weekSummary)}

                <TouchableOpacity
                  style={styles.primaryButtonFull}
                  onPress={goToWallet}
                >
                  <WalletIcon size={17} color={Colors.lime} strokeWidth={1.8} />
                  <Text style={styles.primaryButtonLabel}>Wallet</Text>
                </TouchableOpacity>
              </View>
            )}

            {tab === 'month' && (
              <View style={styles.body}>
                <Card pad={20} style={styles.darkCard}>
                  <Text style={styles.darkEyebrow}>This month</Text>
                  <Text style={styles.darkAmount}>
                    ₹
                    {Math.round(
                      homeData?.ThisMonth
                        ? parseFloat(homeData.ThisMonth.Earnings)
                        : monthSummary.earnings,
                    ).toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.darkMetaRow}>
                    <Text style={styles.darkMetaText}>
                      <Text style={styles.darkMetaStrong}>
                        {homeData?.ThisMonth?.TripsCompleted ??
                          monthSummary.tripCount}
                      </Text>{' '}
                      trips
                    </Text>
                  </View>
                </Card>

                {renderSummaryStrip(monthSummary)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default EarningsScreen;

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
  subtitle: {
    fontSize: fscale(13),
    color: Colors.mute,
    marginTop: vscale(4),
  },
  tabsWrap: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(14),
  },
  stateWrap: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(60),
    alignItems: 'center',
  },
  stateText: {
    fontSize: fscale(13.5),
    color: Colors.mute,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: vscale(12),
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(16),
    borderRadius: hscale(12),
    backgroundColor: Colors.ink,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: fscale(12.5),
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(14),
  },
  darkCard: {
    backgroundColor: Colors.ink,
    borderColor: 'transparent',
  },
  darkCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkEyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  darkAmount: {
    fontSize: fscale(42),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    marginTop: vscale(2),
  },
  darkIconWrap: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkMetaRow: {
    flexDirection: 'row',
    gap: hscale(16),
    marginTop: vscale(14),
  },
  darkMetaText: {
    fontSize: fscale(12.5),
    color: 'rgba(255,255,255,0.6)',
  },
  darkMetaStrong: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  breakdownCard: {
    marginTop: vscale(12),
  },
  breakdownLabel: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: vscale(8),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vscale(8),
  },
  breakdownKey: {
    fontSize: fscale(13.5),
    color: Colors.ink2,
  },
  breakdownValue: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink2,
  },
  breakdownTotal: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
    marginTop: vscale(8),
    paddingTop: vscale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownTotalLabel: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  breakdownTotalValue: {
    fontSize: fscale(18),
    fontWeight: '800',
    color: Colors.green,
  },
  primaryButtonFull: {
    marginTop: vscale(12),
    height: hscale(52),
    borderRadius: hscale(16),
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
  },
  primaryButtonLabel: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekAmount: {
    fontSize: fscale(38),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -1.2,
    marginTop: vscale(4),
  },
  weekMeta: {
    fontSize: fscale(13),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  chartRow: {
    marginTop: vscale(20),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: hscale(6),
    height: vscale(90),
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    gap: vscale(4),
  },
  chartValue: {
    fontSize: fscale(8.5),
    color: Colors.mute,
    fontWeight: '600',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  chartDay: {
    fontSize: fscale(9.5),
  },
  dailyCard: {
    marginTop: vscale(12),
  },
  dailyHeader: {
    padding: hscale(12),
    paddingBottom: vscale(4),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(12),
    paddingHorizontal: hscale(14),
  },
  dailyRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line2,
  },
  dailyBadge: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyBadgeText: {
    fontSize: fscale(11),
    fontWeight: '700',
  },
  dailyTrips: {
    flex: 1,
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  dailyAmount: {
    fontSize: fscale(14),
    fontWeight: '800',
    color: Colors.ink,
  },
});
