import React, { useState } from 'react';
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
import Card from '../../components/common/Card';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import CashIcon from '../../assets/icons/CashIcon';
import RewardIcon from '../../assets/icons/RewardIcon';
import InvoiceIcon from '../../assets/icons/InvoiceIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import {
  PARTNER_EARNINGS_TODAY,
  PARTNER_EARNINGS_WEEK,
  PARTNER_EARNINGS_MONTH,
} from './mockEarningsData';
import { PARTNER_INCENTIVES } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';
import { TabParamList } from '../../navigation/tabTypes';

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

const EarningsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [tab, setTab] = useState<EarningsTab>('today');
  const today = PARTNER_EARNINGS_TODAY;
  const week = PARTNER_EARNINGS_WEEK;
  const month = PARTNER_EARNINGS_MONTH;
  const incentive = PARTNER_INCENTIVES[0];
  const maxDay = Math.max(...week.days.map(d => d.amount), 1);

  const goToPayouts = () => navigation.navigate('Payouts');
  const goToWallet = () => navigation.navigate('Wallet');

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

        {tab === 'today' && (
          <View style={styles.body}>
            <Card pad={20} style={styles.darkCard}>
              <View style={styles.darkCardRow}>
                <View>
                  <Text style={styles.darkEyebrow}>Today's earnings</Text>
                  <Text style={styles.darkAmount}>
                    ₹{today.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.darkIconWrap}>
                  <CashIcon size={22} color={Colors.lime} strokeWidth={1.8} />
                </View>
              </View>
              <View style={styles.darkMetaRow}>
                <Text style={styles.darkMetaText}>
                  <Text style={styles.darkMetaStrong}>{today.trips}</Text> trips
                </Text>
                <Text style={styles.darkMetaText}>
                  <Text style={styles.darkMetaStrong}>{today.hours}</Text>{' '}
                  online
                </Text>
              </View>
            </Card>

            <Card style={styles.breakdownCard} pad={16}>
              <Text style={styles.breakdownLabel}>Breakdown</Text>
              {[
                ['Base fares', today.base],
                ['Distance charges', today.distance],
                ['Time charges', today.time],
                ['Surge / bonus', 0],
              ].map(([k, v]) => (
                <View key={k as string}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownKey}>{k}</Text>
                    <Text style={styles.breakdownValue}>₹{v}</Text>
                  </View>
                  <View style={styles.breakdownTrack}>
                    <View
                      style={[
                        styles.breakdownFill,
                        {
                          width: `${Math.min(
                            ((v as number) / today.amount) * 100,
                            100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownKey, { color: Colors.red }]}>
                  Platform fee
                </Text>
                <Text style={[styles.breakdownValue, { color: Colors.red }]}>
                  −₹{today.platform}
                </Text>
              </View>
              <View style={styles.breakdownTotal}>
                <Text style={styles.breakdownTotalLabel}>Net earnings</Text>
                <Text style={styles.breakdownTotalValue}>
                  ₹{today.amount - today.platform}
                </Text>
              </View>
            </Card>

            {incentive && (
              <Card style={styles.incentiveCard} pad={14}>
                <View style={styles.incentiveRow}>
                  <RewardIcon size={20} color={Colors.ink} strokeWidth={1.8} />
                  <View style={styles.incentiveTextWrap}>
                    <Text style={styles.incentiveTitle}>{incentive.title}</Text>
                    <Text style={styles.incentiveSub}>{incentive.sub}</Text>
                  </View>
                  <Text style={styles.incentiveReward}>
                    +₹{incentive.reward}
                  </Text>
                </View>
              </Card>
            )}

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={styles.ghostButton}
                onPress={goToPayouts}
              >
                <InvoiceIcon size={17} color={Colors.ink} strokeWidth={1.8} />
                <Text style={styles.ghostButtonLabel}>Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goToWallet}
              >
                <WalletIcon size={17} color={Colors.lime} strokeWidth={1.8} />
                <Text style={styles.primaryButtonLabel}>Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {tab === 'week' && (
          <View style={styles.body}>
            <Card pad={16}>
              <Text style={styles.breakdownLabel}>This week</Text>
              <Text style={styles.weekAmount}>
                ₹{week.amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.weekMeta}>{week.trips} trips · Mon–Sun</Text>

              <View style={styles.chartRow}>
                {week.days.map((d, i) => (
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
                            i === 4 ? Colors.ink : 'rgba(15,17,21,0.12)',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.chartDay,
                        {
                          color: i === 4 ? Colors.ink : Colors.mute,
                          fontWeight: i === 4 ? '700' : '500',
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
              {week.days.map((d, i) => (
                <View
                  key={d.day}
                  style={[styles.dailyRow, i > 0 && styles.dailyRowBorder]}
                >
                  <View
                    style={[
                      styles.dailyBadge,
                      { backgroundColor: i === 4 ? Colors.ink : Colors.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dailyBadgeText,
                        { color: i === 4 ? Colors.lime : Colors.mute },
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

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={styles.ghostButton}
                onPress={goToPayouts}
              >
                <InvoiceIcon size={17} color={Colors.ink} strokeWidth={1.8} />
                <Text style={styles.ghostButtonLabel}>Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={goToWallet}
              >
                <WalletIcon size={17} color={Colors.lime} strokeWidth={1.8} />
                <Text style={styles.primaryButtonLabel}>Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {tab === 'month' && (
          <View style={styles.body}>
            <Card pad={20} style={styles.darkCard}>
              <Text style={styles.darkEyebrow}>{month.label}</Text>
              <Text style={styles.darkAmount}>
                ₹{month.net.toLocaleString('en-IN')}
              </Text>
              <View style={styles.darkMetaRow}>
                <Text style={styles.darkMetaText}>
                  <Text style={styles.darkMetaStrong}>{month.trips}</Text> trips
                </Text>
                <Text style={styles.darkMetaText}>
                  <Text style={styles.darkMetaStrong}>{month.acceptance}%</Text>{' '}
                  acceptance
                </Text>
              </View>
            </Card>

            <Card style={styles.breakdownCard} pad={16}>
              <Text style={styles.breakdownLabel}>Monthly summary</Text>
              {[
                ['Total gross', `₹${month.gross.toLocaleString('en-IN')}`],
                [
                  'Platform fees (8%)',
                  `−₹${month.platformFees.toLocaleString('en-IN')}`,
                ],
                ['TDS (1%)', `−₹${month.tds.toLocaleString('en-IN')}`],
                [
                  'Incentives & bonuses',
                  `+₹${month.incentives.toLocaleString('en-IN')}`,
                ],
              ].map(([k, v]) => (
                <View
                  key={k}
                  style={[styles.breakdownRow, styles.monthlyRowBorder]}
                >
                  <Text style={styles.breakdownKey}>{k}</Text>
                  <Text style={[styles.breakdownValue, { fontWeight: '700' }]}>
                    {v}
                  </Text>
                </View>
              ))}
              <View style={styles.breakdownTotal}>
                <Text style={styles.breakdownTotalLabel}>Net income</Text>
                <Text style={styles.breakdownTotalValue}>
                  ₹{month.net.toLocaleString('en-IN')}
                </Text>
              </View>
            </Card>

            <TouchableOpacity style={styles.downloadButton}>
              <InvoiceIcon size={17} color={Colors.ink} strokeWidth={1.8} />
              <Text style={styles.downloadButtonLabel}>
                Download tax statement
              </Text>
            </TouchableOpacity>
          </View>
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
  breakdownTrack: {
    height: vscale(4),
    borderRadius: 2,
    backgroundColor: Colors.bg,
    marginBottom: vscale(4),
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.lime,
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
  incentiveCard: {
    marginTop: vscale(12),
    backgroundColor: 'rgba(200,242,96,0.12)',
    borderColor: 'rgba(200,242,96,0.3)',
  },
  incentiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
  },
  incentiveTextWrap: {
    flex: 1,
  },
  incentiveTitle: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  incentiveSub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  incentiveReward: {
    fontSize: fscale(14),
    fontWeight: '800',
    color: Colors.green,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: hscale(8),
    marginTop: vscale(12),
  },
  ghostButton: {
    flex: 1,
    height: hscale(52),
    borderRadius: hscale(16),
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
  },
  ghostButtonLabel: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  primaryButton: {
    flex: 1,
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
  monthlyRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line2,
  },
  downloadButton: {
    marginTop: vscale(12),
    height: hscale(52),
    borderRadius: hscale(16),
    borderWidth: 0.5,
    borderColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
  },
  downloadButtonLabel: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
});
