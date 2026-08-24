import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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
import SegmentedTabs from '../../components/common/SegmentedTabs';
import TaxiIcon from '../../assets/icons/TaxiIcon';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';
import { getCookie } from '../../utils/session';
import {
  getRideHistory,
  RideHistoryItem,
} from '../../services/api/ridesService';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'TripsTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TripFilter = 'all' | 'completed' | 'cancelled';

// COMPLETED maps to the "completed" tab; everything else (CANCELLED,
// REJECTED, etc.) falls into "cancelled" — GetRideHistory is only
// confirmed to return COMPLETED so far, but this keeps the filter safe
// if other terminal statuses show up later.
const isCompletedStatus = (status: string) =>
  status?.toUpperCase() === 'COMPLETED';

const TripHistoryScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const [tab, setTab] = useState<TripFilter>('all');

  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  // `loading` -> center loader, only for the very first load (no data yet).
  // `refreshing` -> top pull-to-refresh spinner, only for a manual swipe.
  // Refetching in the background (e.g. on refocus) uses neither — the
  // list just stays on screen and updates quietly once the new data lands.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type LoadMode = 'initial' | 'manual' | 'silent';

  const loadHistory = useCallback(
    async (mode: LoadMode = 'initial') => {
      if (mode === 'initial') setLoading(true);
      if (mode === 'manual') setRefreshing(true);
      if (mode !== 'silent') setError(null);
      try {
        const cookie = await getCookie();
        if (!cookie) {
          if (mode !== 'silent') setError(t('trips.errors.sessionNotFound'));
          return;
        }
        const res = await getRideHistory(cookie);
        if (res.Result !== 'Success' || !res.Rides) {
          if (mode !== 'silent') {
            setError(res.Message || t('trips.errors.loadFailed'));
          }
          return;
        }
        setRides(res.Rides);
      } catch (err: any) {
        // A silent background refetch failing shouldn't yank the
        // already-visible list away and replace it with an error screen —
        // just leave the last-known list up and try again next time.
        if (mode !== 'silent') {
          setError(err?.message || t('trips.errors.loadFailed'));
        }
      } finally {
        if (mode === 'initial') setLoading(false);
        if (mode === 'manual') setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadHistory('initial');
  }, [loadHistory]);

  // Refresh every time the Trips tab regains focus (e.g. after completing
  // a new ride) so the list doesn't go stale. Skip the very first focus —
  // it fires at the same time as the mount effect above and would just
  // re-trigger the same load a second time. Later refocuses fetch silently
  // (no loader at all) since the list is already showing good data.
  const hasFocusedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }
      loadHistory('silent');
    }, [loadHistory]),
  );

  const TAB_OPTIONS = [
    { id: 'all', label: t('trips.status.all') },
    { id: 'completed', label: t('trips.status.completed') },
    { id: 'cancelled', label: t('trips.status.cancelled') },
  ];

  const filtered =
    tab === 'all'
      ? rides
      : rides.filter(r =>
          tab === 'completed'
            ? isCompletedStatus(r.Status)
            : !isCompletedStatus(r.Status),
        );

  const openTripDetail = (ride: RideHistoryItem) =>
    navigation.navigate('TripDetail', {
      tripId: ride.RideTran,
      createdDate: ride.CreatedDate,
      createdTime: ride.CreatedTime,
    });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHistory('manual')}
            tintColor={Colors.ink}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('trips.title')}</Text>
          <Text style={styles.subtitle}>{t('trips.subtitle')}</Text>
        </View>

        <View style={styles.tabsWrap}>
          <SegmentedTabs
            options={TAB_OPTIONS}
            value={tab}
            onChange={id => setTab(id as TripFilter)}
          />
        </View>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Colors.ink} size="small" />
            <Text style={styles.stateText}>{t('trips.loading')}</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={() => loadHistory('initial')}
            >
              <Text style={styles.retryButtonText}>{t('trips.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.list}>
            {filtered.map(ride => {
              const completed = isCompletedStatus(ride.Status);
              return (
                <Card key={ride.RideId} pad={14} style={styles.tripCard}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openTripDetail(ride)}
                    style={styles.tripRow}
                  >
                    <View style={styles.tripIconWrap}>
                      <TaxiIcon
                        size={20}
                        color={Colors.ink}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={styles.tripTextWrap}>
                      <Text style={styles.tripRoute} numberOfLines={1}>
                        {ride.PickupAddress} → {ride.DropAddress}
                      </Text>
                      <Text style={styles.tripMeta}>
                        {ride.CreatedDate} · {ride.CreatedTime} ·{' '}
                        {ride.DistanceKM} km
                      </Text>
                      <Text style={styles.tripId}>{ride.RideId}</Text>
                    </View>
                    <View style={styles.tripAmountWrap}>
                      <Text
                        style={[
                          styles.tripEarning,
                          { color: completed ? Colors.ink : Colors.mute },
                        ]}
                      >
                        {completed ? ride.FinalFareText : '—'}
                      </Text>
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: completed
                              ? '#E9F8E4'
                              : 'rgba(224,82,78,0.1)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: completed ? Colors.green : Colors.red },
                          ]}
                        >
                          {completed
                            ? t('trips.status.completed')
                            : t('trips.status.cancelled')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Text style={styles.emptyText}>
                {t('trips.emptyFor', { filter: t(`trips.status.${tab}`) })}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TripHistoryScreen;

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
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vscale(36),
    gap: vscale(10),
  },
  stateText: {
    fontSize: fscale(12.5),
    color: Colors.mute,
  },
  errorText: {
    fontSize: fscale(13),
    color: Colors.mute,
    textAlign: 'center',
    paddingHorizontal: hscale(24),
  },
  retryButton: {
    marginTop: vscale(4),
    paddingVertical: vscale(9),
    paddingHorizontal: hscale(20),
    borderRadius: hscale(12),
    backgroundColor: Colors.ink,
  },
  retryButtonText: {
    fontSize: fscale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  list: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(14),
    gap: vscale(10),
  },
  tripCard: {
    marginBottom: 0,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  tripIconWrap: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(13),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  tripRoute: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  tripMeta: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(1),
  },
  tripId: {
    fontSize: fscale(10),
    color: Colors.mute2,
    fontFamily: 'monospace',
    marginTop: vscale(2),
  },
  tripAmountWrap: {
    alignItems: 'flex-end',
  },
  tripEarning: {
    fontSize: fscale(15),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusChip: {
    paddingVertical: vscale(3),
    paddingHorizontal: hscale(7),
    borderRadius: hscale(6),
    marginTop: vscale(4),
  },
  statusText: {
    fontSize: fscale(10.5),
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: vscale(40),
    color: Colors.mute,
    fontSize: fscale(14),
  },
});
