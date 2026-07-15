import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import HeaderBack from '../../components/common/HeaderBack';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import ClockIcon from '../../assets/icons/ClockIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import { RootStackParamList } from '../../navigation/types';
import { CREDIT_PLANS, CreditPlan, ratePerHour } from '../../constants/credit';
import {
  activateCreditDemo,
  getActiveCredit,
  formatTimeLeft,
  ActiveCredit,
} from '../../utils/credit';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'BuyCredit'>;

/**
 * Shown when the partner taps "Go Online" on Home with no active credit.
 * No billing API exists yet — "Buy Now" activates a local demo credit
 * window via utils/credit.ts (see that file for the swap point once a
 * real payment endpoint exists). Prices/hours come from constants/credit.ts.
 */
const BuyCreditScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [active, setActive] = useState<ActiveCredit | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<CreditPlan | null>(null);

  useEffect(() => {
    getActiveCredit().then(setActive);
  }, []);

  const handleBuy = async (plan: CreditPlan) => {
    if (buyingId) return;
    setBuyingId(plan.id);
    try {
      // DEMO: no payment flow yet — this just activates the window locally.
      const result = await activateCreditDemo(plan.id, plan.hours);
      setActive(result);
      setJustActivated(plan);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBack
        title="Buy Credit"
        sub="Choose a plan to go online"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {active && (
          <Card pad={16} style={styles.activeCard}>
            <View style={styles.activeIconWrap}>
              <CheckIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.activeTitle}>
                {justActivated
                  ? `${justActivated.label} credit activated`
                  : 'Credit active'}
              </Text>
              <Text style={styles.activeSub}>
                {formatTimeLeft(active.msLeft)} · you can go online now
              </Text>
            </View>
          </Card>
        )}

        <Text style={styles.sectionLabel}>Available plans</Text>

        {CREDIT_PLANS.map(plan => {
          const isActivePlan = active?.planId === plan.id;
          const isBuying = buyingId === plan.id;
          return (
            <Card key={plan.id} pad={18} style={styles.planCard}>
              <View style={styles.planTopRow}>
                <View style={styles.planIconWrap}>
                  <ClockIcon size={19} color={Colors.ink} strokeWidth={1.8} />
                </View>
                {isActivePlan && (
                  <View style={styles.activeBadge}>
                    <CheckIcon size={11} color={Colors.green} strokeWidth={2.6} />
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>

              <Text style={styles.planHours}>{plan.label}</Text>
              <Text style={styles.planRate}>
                ≈ ₹{ratePerHour(plan)}/hr · demo rate
              </Text>

              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>₹{plan.price}</Text>
                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    (isBuying || (buyingId && !isBuying)) &&
                      styles.buyButtonDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={!!buyingId}
                  onPress={() => handleBuy(plan)}
                >
                  <Text style={styles.buyButtonText}>
                    {isBuying ? 'Activating…' : 'Buy Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        <Text style={styles.footNote}>
          Demo pricing — real plans, rates and payment will connect once the
          billing API is ready.
        </Text>
      </ScrollView>

      {active && (
        <View style={styles.footer}>
          <PrimaryButton
            label="Done, back to Home"
            onPress={() => navigation.goBack()}
            icon="arrowRight"
            style={styles.fullButton}
          />
        </View>
      )}
    </View>
  );
};

export default BuyCreditScreen;

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
    paddingBottom: vscale(24),
  },
  sectionLabel: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: vscale(8),
    marginBottom: vscale(10),
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    backgroundColor: 'rgba(31,157,107,0.08)',
    borderColor: 'rgba(31,157,107,0.25)',
    marginTop: vscale(4),
    marginBottom: vscale(18),
  },
  activeIconWrap: {
    width: hscale(32),
    height: hscale(32),
    borderRadius: hscale(11),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  activeSub: {
    fontSize: fscale(12),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  planCard: {
    marginBottom: vscale(14),
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planIconWrap: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(13),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(4),
    paddingVertical: vscale(4),
    paddingHorizontal: hscale(8),
    borderRadius: hscale(8),
    backgroundColor: '#E9F8E4',
  },
  activeBadgeText: {
    fontSize: fscale(10.5),
    fontWeight: '700',
    color: Colors.green,
  },
  planHours: {
    fontSize: fscale(19),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.4,
    marginTop: vscale(12),
  },
  planRate: {
    fontSize: fscale(12),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  planPriceRow: {
    marginTop: vscale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planPrice: {
    fontSize: fscale(24),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.6,
  },
  buyButton: {
    paddingVertical: vscale(11),
    paddingHorizontal: hscale(22),
    borderRadius: hscale(14),
    backgroundColor: Colors.ink,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footNote: {
    fontSize: fscale(11.5),
    color: Colors.mute2,
    textAlign: 'center',
    marginTop: vscale(6),
    lineHeight: fscale(17),
  },
  footer: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(28),
    paddingTop: vscale(10),
  },
  fullButton: {
    width: '100%',
  },
});
