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
import WalletIcon from '../../assets/icons/WalletIcon';
import CashIcon from '../../assets/icons/CashIcon';
import TaxiIcon from '../../assets/icons/TaxiIcon';
import ArrowRightIcon from '../../assets/icons/ArrowRightIcon';
import {
  PARTNER_WALLET_BALANCE,
  PARTNER_WALLET_TRANSACTIONS,
} from './mockWalletData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const TXN_ICONS = { cash: CashIcon, taxi: TaxiIcon };

const WalletScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [wholeRupees, paise] = PARTNER_WALLET_BALANCE.toFixed(2).split('.');

  return (
    <View style={styles.container}>
      <HeaderBack
        title="Wallet"
        sub="Partner earnings balance"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card pad={0} style={styles.balanceCard}>
          <View style={styles.balanceCardGlow} />
          <View style={styles.balanceCardInner}>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.eyebrow}>Wallet balance</Text>
                <Text style={styles.balanceAmount}>
                  ₹ {Number(wholeRupees).toLocaleString('en-IN')}
                  <Text style={styles.balancePaise}>.{paise}</Text>
                </Text>
              </View>
              <View style={styles.walletIconWrap}>
                <WalletIcon size={22} color={Colors.lime} strokeWidth={1.8} />
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewPayoutsButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Payouts')}
            >
              <Text style={styles.viewPayoutsLabel}>View payouts</Text>
              <ArrowRightIcon size={16} color={Colors.ink} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Recent transactions</Text>
        <Card pad={4}>
          {PARTNER_WALLET_TRANSACTIONS.map((tr, i) => {
            const IconComponent = TXN_ICONS[tr.icon];
            return (
              <View
                key={`${tr.title}-${i}`}
                style={[
                  styles.txnRow,
                  i < PARTNER_WALLET_TRANSACTIONS.length - 1 &&
                    styles.txnRowDivider,
                ]}
              >
                <View style={styles.txnIconWrap}>
                  <IconComponent
                    size={18}
                    color={Colors.ink}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={styles.txnTextWrap}>
                  <Text style={styles.txnTitle} numberOfLines={1}>
                    {tr.title}
                  </Text>
                  <Text style={styles.txnMeta}>{tr.meta}</Text>
                </View>
                <Text
                  style={[
                    styles.txnAmount,
                    { color: tr.positive ? Colors.green : Colors.ink },
                  ]}
                >
                  {tr.amount}
                </Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
};

export default WalletScreen;

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
  balanceCard: {
    backgroundColor: '#0F1115',
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  balanceCardGlow: {
    position: 'absolute',
    top: hscale(-40),
    right: hscale(-40),
    width: hscale(160),
    height: hscale(160),
    borderRadius: hscale(80),
    backgroundColor: 'rgba(200,242,96,0.18)',
  },
  balanceCardInner: {
    padding: hscale(20),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: fscale(36),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginTop: vscale(2),
  },
  balancePaise: {
    fontSize: fscale(18),
    opacity: 0.7,
    fontWeight: '700',
  },
  walletIconWrap: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPayoutsButton: {
    marginTop: vscale(14),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
    paddingVertical: vscale(10),
    paddingHorizontal: hscale(16),
    borderRadius: hscale(13),
    backgroundColor: Colors.lime,
  },
  viewPayoutsLabel: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  sectionLabel: {
    marginTop: vscale(14),
    marginBottom: vscale(8),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(12),
  },
  txnRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  txnIconWrap: {
    width: hscale(38),
    height: hscale(38),
    borderRadius: hscale(12),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  txnTitle: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  txnMeta: {
    fontSize: fscale(11),
    color: Colors.mute,
  },
  txnAmount: {
    fontSize: fscale(14),
    fontWeight: '800',
  },
});
