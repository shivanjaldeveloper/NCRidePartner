import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import Card from '../../components/common/Card';
import LocateIcon from '../../assets/icons/LocateIcon';
import SosIcon from '../../assets/icons/SosIcon';
import CashIcon from '../../assets/icons/CashIcon';
import TaxiIcon from '../../assets/icons/TaxiIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import StarIcon from '../../assets/icons/StarIcon';
import CarIcon from '../../assets/icons/CarIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import RideRequestSheet from './RideRequestSheet';
import {
  PARTNER_PROFILE,
  PARTNER_STATS,
  PARTNER_DEMAND_ZONES,
  PARTNER_INCENTIVES,
  PARTNER_VEHICLES,
  PARTNER_PAYOUTS,
  PARTNER_TRIPS,
  PARTNER_RIDE_REQUEST,
} from './mockHomeData';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [online, setOnline] = useState(false);
  const [showRidePopup, setShowRidePopup] = useState(false);
  const rideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vehicle = PARTNER_VEHICLES[0];
  const payout = PARTNER_PAYOUTS[0];
  const incentive = PARTNER_INCENTIVES[0];

  useEffect(() => {
    return () => {
      if (rideTimerRef.current) clearTimeout(rideTimerRef.current);
    };
  }, []);

  const handleGoOnline = () => {
    if (online) return; // once online, stays online — matches source behavior
    setOnline(true);
    rideTimerRef.current = setTimeout(() => setShowRidePopup(true), 3000);
  };

  const handleAcceptRide = () => {
    setShowRidePopup(false);
    navigation.navigate('RideRequest');
  };

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
            <Text style={styles.avatarText}>{PARTNER_PROFILE.initials}</Text>
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>{PARTNER_PROFILE.name}</Text>
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
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => navigation.navigate('SOS')}
          >
            <SosIcon size={20} color={Colors.red} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Online toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleGoOnline}
            activeOpacity={0.9}
            style={[
              styles.onlineToggle,
              { backgroundColor: online ? Colors.green : Colors.ink },
            ]}
          >
            <View style={styles.onlineIconWrap}>
              <LocateIcon
                size={20}
                color={online ? '#FFFFFF' : Colors.lime}
                strokeWidth={2}
              />
            </View>
            <Text
              style={[
                styles.onlineLabel,
                { color: online ? '#FFFFFF' : Colors.lime },
              ]}
            >
              {online ? 'You are Online' : 'Go Online'}
            </Text>
            {online && <Text style={styles.onlineSub}>Sector 62, Noida</Text>}
          </TouchableOpacity>
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
                ₹{PARTNER_STATS.todayEarnings.toLocaleString('en-IN')}
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
                {PARTNER_STATS.todayTrips} trips
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
                {PARTNER_STATS.onlineHours}
              </Text>
              <Text style={styles.statCardLabel}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#FCE6E0' }]}
              >
                <StarIcon size={17} color={Colors.ink} strokeWidth={1.8} />
              </View>
              <Text style={styles.statCardValue}>{PARTNER_STATS.rating}</Text>
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
            {PARTNER_DEMAND_ZONES.map(zone => (
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
            <View style={styles.verifiedChip}>
              <Text style={styles.verifiedText}>Verified</Text>
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

        {/* Next payout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.payoutRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Payouts')}
          >
            <View style={styles.payoutIconWrap}>
              <WalletIcon size={20} color={Colors.lime} strokeWidth={1.8} />
            </View>
            <View style={styles.payoutTextWrap}>
              <Text style={styles.payoutEyebrow}>Next payout</Text>
              <Text style={styles.payoutAmount}>
                ₹{payout.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.payoutDate}>Due {payout.date}</Text>
            </View>
            <ChevronRightIcon
              size={18}
              color="rgba(255,255,255,0.5)"
              strokeWidth={2}
            />
          </TouchableOpacity>
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
            {PARTNER_TRIPS.slice(0, 3).map((trip, i) => (
              <TouchableOpacity
                key={trip.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('TripDetail', { tripId: trip.id })
                }
                style={[styles.tripRow, i < 2 && styles.tripRowDivider]}
              >
                <View style={styles.tripIconWrap}>
                  <TaxiIcon size={18} color={Colors.ink} strokeWidth={1.8} />
                </View>
                <View style={styles.tripTextWrap}>
                  <Text style={styles.tripRoute} numberOfLines={1}>
                    {trip.from} → {trip.to}
                  </Text>
                  <Text style={styles.tripMeta}>
                    {trip.date} · {trip.dist}
                  </Text>
                </View>
                <View style={styles.tripAmountWrap}>
                  <Text
                    style={[
                      styles.tripEarning,
                      {
                        color:
                          trip.status === 'Cancelled' ? Colors.red : Colors.ink,
                      },
                    ]}
                  >
                    ₹{trip.earning}
                  </Text>
                  <Text
                    style={[
                      styles.tripStatus,
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
              </TouchableOpacity>
            ))}
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

      <RideRequestSheet
        visible={showRidePopup}
        request={PARTNER_RIDE_REQUEST}
        onClose={() => setShowRidePopup(false)}
        onAccept={handleAcceptRide}
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
  sosButton: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(14),
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
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
  verifiedText: {
    color: Colors.green,
    fontSize: fscale(10.5),
    fontWeight: '700',
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
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(14),
    paddingHorizontal: hscale(16),
    backgroundColor: Colors.ink,
    borderRadius: hscale(18),
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  payoutIconWrap: {
    width: hscale(42),
    height: hscale(42),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTextWrap: {
    flex: 1,
  },
  payoutEyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  payoutAmount: {
    fontSize: fscale(20),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  payoutDate: {
    fontSize: fscale(11.5),
    color: 'rgba(255,255,255,0.55)',
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
