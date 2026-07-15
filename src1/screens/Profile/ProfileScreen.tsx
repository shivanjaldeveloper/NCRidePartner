import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Row from '../../components/common/Row';
import RewardIcon from '../../assets/icons/RewardIcon';
import CarIcon from '../../assets/icons/CarIcon';
import UserIcon from '../../assets/icons/UserIcon';
import CashIcon from '../../assets/icons/CashIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import BellIcon from '../../assets/icons/BellIcon';
import SettingsIcon from '../../assets/icons/SettingsIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import SosIcon from '../../assets/icons/SosIcon';
import LogoutIcon from '../../assets/icons/LogoutIcon';
import {
  PARTNER_PROFILE,
  PARTNER_STATS,
  PARTNER_VEHICLES,
  PARTNER_PAYOUTS,
} from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'AccountTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavProp>();
  const p = PARTNER_PROFILE;
  const s = PARTNER_STATS;
  const vehicle = PARTNER_VEHICLES[0];
  const payout = PARTNER_PAYOUTS[0];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
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
                  <Text style={styles.goldBadgeText}>GOLD PARTNER</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                { v: s.rating, l: 'Rating' },
                { v: s.totalTrips.toLocaleString('en-IN'), l: 'Trips' },
                { v: `${s.acceptanceRate}%`, l: 'Acceptance' },
              ].map((item, i) => (
                <View
                  key={item.l}
                  style={[styles.statItem, i > 0 && styles.statItemBorder]}
                >
                  <Text style={styles.statValue}>{item.v}</Text>
                  <Text style={styles.statLabel}>{item.l}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card pad={4} style={styles.groupCard}>
            <Row
              icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title="Vehicle details"
              sub={`${vehicle.number} · ${vehicle.type}`}
              onPress={() => navigation.navigate('Vehicle')}
              showDivider
            />
            <Row
              icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title="Documents"
              sub="All 7 verified"
              onPress={() => navigation.navigate('Documents')}
              showDivider
            />
            <Row
              icon={<CashIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title="Earnings"
              sub="₹72,800 this month"
              onPress={() => navigation.navigate('EarningsTab')}
              showDivider
            />
            <Row
              icon={
                <WalletIcon size={18} color={Colors.ink} strokeWidth={1.8} />
              }
              title="Payouts"
              sub={`₹${payout.amount.toLocaleString('en-IN')} due ${
                payout.date
              }`}
              onPress={() => navigation.navigate('Payouts')}
            />
          </Card>

          <Card pad={4} style={styles.groupCard}>
            <Row
              icon={<BellIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title="Notifications"
              sub="Ride requests, alerts"
              onPress={() => navigation.navigate('Settings')}
              showDivider
            />
            <Row
              icon={
                <SettingsIcon size={18} color={Colors.ink} strokeWidth={1.8} />
              }
              title="App settings"
              sub="Language, preferences"
              onPress={() => navigation.navigate('Settings')}
              showDivider
            />
            <Row
              icon={<ChatIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title="Help & support"
              onPress={() => navigation.navigate('SupportTab')}
              showDivider
            />
            <Row
              icon={<SosIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title="Emergency SOS"
              sub="Quick access contacts"
              onPress={() => navigation.navigate('SOS')}
              showDivider
            />
            <Row
              icon={
                <LogoutIcon size={18} color={Colors.red} strokeWidth={1.8} />
              }
              title="Log out"
              danger
              onPress={() => navigation.navigate('Logout')}
            />
          </Card>

          <Text style={styles.footerText}>
            Alo Alo Partner · v 1.0.0 · Marathwada, India
          </Text>
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
