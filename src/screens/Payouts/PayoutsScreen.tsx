import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import HeaderBack from '../../components/common/HeaderBack';
import ClockIcon from '../../assets/icons/ClockIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import CashIcon from '../../assets/icons/CashIcon';
import { PARTNER_PAYOUTS, PARTNER_BANK_ACCOUNT } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const PayoutsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const payouts = PARTNER_PAYOUTS;
  const next = payouts[0];
  const bank = PARTNER_BANK_ACCOUNT;

  return (
    <View style={styles.container}>
      <HeaderBack
        title="Payouts"
        sub="Weekly bank transfer"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card pad={0} style={styles.nextCard}>
          <View style={styles.nextCardGlow} />
          <View style={styles.nextCardInner}>
            <Text style={styles.eyebrow}>Next payout</Text>
            <Text style={styles.nextAmount}>
              ₹{next.amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.nextMeta}>
              {next.date} · {next.trips} trips
            </Text>
            <View style={styles.bankChip}>
              <View style={styles.bankChipDot} />
              <Text style={styles.bankChipText}>
                {bank.bankName.split(' ')[0]} {bank.maskedNumber}
              </Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Payout history</Text>
        <View style={styles.historyList}>
          {payouts.map(p => (
            <Card key={p.id} pad={14}>
              <View style={styles.historyRow}>
                <View
                  style={[
                    styles.historyIconWrap,
                    {
                      backgroundColor:
                        p.status === 'Upcoming'
                          ? 'rgba(200,242,96,0.15)'
                          : '#E9F8E4',
                    },
                  ]}
                >
                  {p.status === 'Upcoming' ? (
                    <ClockIcon size={20} color={Colors.ink} strokeWidth={1.8} />
                  ) : (
                    <CheckIcon
                      size={20}
                      color={Colors.green}
                      strokeWidth={2.2}
                    />
                  )}
                </View>
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyAmount}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {p.date} · {p.trips} trips
                  </Text>
                  <Text style={styles.historyId}>{p.id}</Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        p.status === 'Upcoming'
                          ? 'rgba(200,242,96,0.15)'
                          : '#E9F8E4',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          p.status === 'Upcoming' ? Colors.ink : Colors.green,
                      },
                    ]}
                  >
                    {p.status}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Card style={styles.bankCard} pad={14}>
          <View style={styles.bankRow}>
            <CashIcon size={18} color={Colors.green} strokeWidth={1.8} />
            <View style={styles.bankTextWrap}>
              <Text style={styles.bankName}>
                {bank.bankName} {bank.maskedNumber}
              </Text>
              <Text style={styles.bankSub}>
                Primary bank account ·{' '}
                {bank.verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
            <TouchableOpacity style={styles.changeButton}>
              <Text style={styles.changeButtonLabel}>Change</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

export default PayoutsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(4),
    paddingBottom: vscale(30),
  },
  nextCard: {
    backgroundColor: '#0F1115',
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  nextCardGlow: {
    position: 'absolute',
    top: hscale(-30),
    right: hscale(-30),
    width: hscale(130),
    height: hscale(130),
    borderRadius: hscale(65),
    backgroundColor: 'rgba(200,242,96,0.18)',
  },
  nextCardInner: {
    padding: hscale(20),
  },
  eyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  nextAmount: {
    fontSize: fscale(38),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginTop: vscale(4),
  },
  nextMeta: {
    fontSize: fscale(13),
    color: 'rgba(255,255,255,0.6)',
    marginTop: vscale(4),
  },
  bankChip: {
    marginTop: vscale(14),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    paddingVertical: vscale(6),
    paddingHorizontal: hscale(12),
    borderRadius: 99,
    backgroundColor: 'rgba(200,242,96,0.15)',
  },
  bankChipDot: {
    width: hscale(6),
    height: hscale(6),
    borderRadius: hscale(3),
    backgroundColor: Colors.lime,
  },
  bankChipText: {
    fontSize: fscale(11.5),
    color: Colors.lime,
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: vscale(16),
    marginBottom: vscale(8),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  historyList: {
    gap: vscale(10),
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  historyIconWrap: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTextWrap: {
    flex: 1,
  },
  historyAmount: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  historyMeta: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  historyId: {
    fontSize: fscale(10.5),
    color: Colors.mute2,
    fontFamily: 'monospace',
    marginTop: vscale(2),
  },
  statusChip: {
    paddingVertical: vscale(4),
    paddingHorizontal: hscale(8),
    borderRadius: hscale(8),
  },
  statusText: {
    fontSize: fscale(11),
    fontWeight: '700',
  },
  bankCard: {
    marginTop: vscale(14),
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
  },
  bankTextWrap: {
    flex: 1,
  },
  bankName: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  bankSub: {
    fontSize: fscale(12),
    color: Colors.mute,
  },
  changeButton: {
    paddingVertical: vscale(7),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(10),
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  changeButtonLabel: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.ink,
  },
});
