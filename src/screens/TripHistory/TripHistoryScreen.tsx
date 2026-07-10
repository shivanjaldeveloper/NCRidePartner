import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import TaxiIcon from '../../assets/icons/TaxiIcon';
import { PARTNER_TRIPS } from '../Home/mockHomeData';

type TripFilter = 'all' | 'completed' | 'cancelled';

const TAB_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const TripHistoryScreen = () => {
  const [tab, setTab] = useState<TripFilter>('all');

  const filtered =
    tab === 'all'
      ? PARTNER_TRIPS
      : PARTNER_TRIPS.filter(t => t.status.toLowerCase() === tab);

  // TODO: Trip Detail screen isn't built yet — wire this up once it exists.
  const openTripDetail = (tripId: string) =>
    console.log('TODO: navigate to TripDetail', tripId);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.subtitle}>All trips as an Alo Alo Partner</Text>
        </View>

        <View style={styles.tabsWrap}>
          <SegmentedTabs
            options={TAB_OPTIONS}
            value={tab}
            onChange={id => setTab(id as TripFilter)}
          />
        </View>

        <View style={styles.list}>
          {filtered.map(trip => (
            <Card key={trip.id} pad={14} style={styles.tripCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openTripDetail(trip.id)}
                style={styles.tripRow}
              >
                <View style={styles.tripIconWrap}>
                  <TaxiIcon size={20} color={Colors.ink} strokeWidth={1.8} />
                </View>
                <View style={styles.tripTextWrap}>
                  <Text style={styles.tripRoute} numberOfLines={1}>
                    {trip.from} → {trip.to}
                  </Text>
                  <Text style={styles.tripMeta}>
                    {trip.date} · {trip.dist}
                  </Text>
                  <Text style={styles.tripId}>{trip.id}</Text>
                </View>
                <View style={styles.tripAmountWrap}>
                  <Text
                    style={[
                      styles.tripEarning,
                      {
                        color:
                          trip.status === 'Cancelled'
                            ? Colors.mute
                            : Colors.ink,
                      },
                    ]}
                  >
                    {trip.status === 'Cancelled' ? '—' : `₹${trip.earning}`}
                  </Text>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          trip.status === 'Completed'
                            ? '#E9F8E4'
                            : 'rgba(224,82,78,0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            trip.status === 'Completed'
                              ? Colors.green
                              : Colors.red,
                        },
                      ]}
                    >
                      {trip.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Text style={styles.emptyText}>No {tab} trips yet.</Text>
          )}
        </View>
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
    paddingTop: vscale(24),
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
