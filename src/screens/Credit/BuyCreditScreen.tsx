import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import HeaderBack from '../../components/common/HeaderBack';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import ClockIcon from '../../assets/icons/ClockIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import { RootStackParamList } from '../../navigation/types';
import { getCookie } from '../../utils/session';
import {
  getActiveCredit,
  formatTimeLeft,
  ActiveCredit,
} from '../../utils/credit';
import {
  getPartnerPlanList,
  PartnerPlan,
} from '../../services/api/plansService';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'BuyCredit'>;

const ratePerHour = (plan: PartnerPlan) => {
  const rate = Number(plan.PlanRate) / Number(plan.PlanTime || 1);
  return Number.isFinite(rate) ? Math.round(rate) : 0;
};

const BuyCreditScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [active, setActive] = useState<ActiveCredit | null>(null);
  const [plans, setPlans] = useState<PartnerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<PartnerPlan | null>(null);

  const loadPlans = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        setError('Session not found. Please log in again.');
        return;
      }
      const res = await getPartnerPlanList(cookie);
      if (res.Result !== 'Success' || !res.Plans) {
        setError(res.Message || 'Could not load plans right now.');
        return;
      }
      const sorted = [...res.Plans].sort(
        (a, b) => Number(a.PlanTime) - Number(b.PlanTime),
      );
      setPlans(sorted);
    } catch (err: any) {
      setError(err?.message || 'Could not load plans right now.');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useFocusEffect(
    useCallback(() => {
      getActiveCredit().then(result => {
        setActive(result);
        if (result) {
          const matched = plans.find(p => p.PlanTransaction === result.planId);
          if (matched) setJustActivated(matched);
        }
      });
    }, [plans]),
  );

  const bestValueId = useMemo(() => {
    if (!plans.length) return null;
    return plans.reduce((best, p) =>
      ratePerHour(p) < ratePerHour(best) ? p : best,
    ).PlanTransaction;
  }, [plans]);

  const handleBuy = (plan: PartnerPlan) => {
    navigation.navigate('Payment', {
      planId: plan.PlanTransaction,
      planName: plan.PlanName,
      planTime: Number(plan.PlanTime),
      planRate: plan.PlanRate,
    });
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPlans(true)}
            tintColor={Colors.ink}
          />
        }
      >
        {active && (
          <Card pad={16} style={styles.activeCard}>
            <View style={styles.activeIconWrap}>
              <CheckIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.activeTitle}>
                {justActivated
                  ? `${justActivated.PlanName} credit activated`
                  : 'Credit active'}
              </Text>
              <Text style={styles.activeSub}>
                {formatTimeLeft(active.msLeft)} · you can go online now
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionLabel}>
            {plans.length ? `Plans in ${plans[0].Region}` : 'Available plans'}
          </Text>
          {plans.length > 0 && (
            <Text style={styles.sectionCount}>
              {plans.length} option{plans.length === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Colors.ink} size="small" />
            <Text style={styles.stateText}>Loading plans…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={() => loadPlans()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading &&
          !error &&
          plans.map(plan => {
            const isActivePlan = active?.planId === plan.PlanTransaction;
            const isBestValue = plan.PlanTransaction === bestValueId;
            const rate = ratePerHour(plan);

            return (
              <Card
                key={plan.PlanTransaction}
                pad={14}
                style={[
                  styles.planCard,
                  isBestValue && styles.planCardHighlighted,
                ]}
              >
                <View style={styles.planRow}>
                  <View style={styles.planIconWrap}>
                    <ClockIcon size={17} color={Colors.ink} strokeWidth={1.8} />
                  </View>

                  <View style={styles.planInfo}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.PlanName}</Text>
                      {isBestValue && !isActivePlan && (
                        <View style={styles.bestValueBadge}>
                          <Text style={styles.bestValueBadgeText}>
                            Best value
                          </Text>
                        </View>
                      )}
                      {isActivePlan && (
                        <View style={styles.activeBadge}>
                          <CheckIcon
                            size={10}
                            color={Colors.green}
                            strokeWidth={2.8}
                          />
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planMeta}>
                      {plan.PlanTime} hr{Number(plan.PlanTime) === 1 ? '' : 's'}{' '}
                      · {plan.PlanRideCount} rides · ₹{rate}/hr
                    </Text>
                  </View>
                </View>

                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>₹{plan.PlanRate}</Text>
                  <TouchableOpacity
                    style={styles.buyButton}
                    activeOpacity={0.85}
                    onPress={() => handleBuy(plan)}
                  >
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

        {!loading && !error && plans.length > 0 && (
          <Text style={styles.footNote}>
            Prices and hours shown are live from your region's active plans.
            Checkout opens in test mode until the billing API is ready — no real
            money moves.
          </Text>
        )}
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
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: vscale(8),
    marginBottom: vscale(10),
  },
  sectionLabel: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionCount: {
    fontSize: fscale(11.5),
    color: Colors.mute2,
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
    paddingHorizontal: hscale(12),
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

  // Compact list card — everything in two tight rows instead of four.
  planCard: {
    marginBottom: vscale(10),
  },
  planCardHighlighted: {
    borderColor: Colors.green,
    borderWidth: 1.2,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconWrap: {
    width: hscale(34),
    height: hscale(34),
    borderRadius: hscale(11),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: hscale(11),
  },
  planInfo: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: hscale(6),
  },
  planName: {
    fontSize: fscale(15.5),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  planMeta: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  bestValueBadge: {
    paddingVertical: vscale(2),
    paddingHorizontal: hscale(7),
    borderRadius: hscale(6),
    backgroundColor: '#E9F8E4',
  },
  bestValueBadgeText: {
    fontSize: fscale(9.5),
    fontWeight: '700',
    color: Colors.green,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(3),
    paddingVertical: vscale(2),
    paddingHorizontal: hscale(7),
    borderRadius: hscale(6),
    backgroundColor: '#E9F8E4',
  },
  activeBadgeText: {
    fontSize: fscale(9.5),
    fontWeight: '700',
    color: Colors.green,
  },
  planPriceRow: {
    marginTop: vscale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planPrice: {
    fontSize: fscale(19),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  buyButton: {
    paddingVertical: vscale(9),
    paddingHorizontal: hscale(18),
    borderRadius: hscale(12),
    backgroundColor: Colors.ink,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    fontSize: fscale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  footNote: {
    fontSize: fscale(11.5),
    color: Colors.mute2,
    textAlign: 'center',
    marginTop: vscale(10),
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
