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
import { useTranslation } from 'react-i18next';
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
  refreshActiveCreditFromServer,
  formatTimeLeft,
  ActiveCredit,
} from '../../utils/credit';
import {
  getPartnerPlanList,
  getPartnerPlanHistory,
  PartnerPlan,
  PartnerPlanHistoryItem,
} from '../../services/api/plansService';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'BuyCredit'>;

const ratePerHour = (plan: PartnerPlan) => {
  const rate = Number(plan.PlanRate) / Number(plan.PlanTime || 1);
  return Number.isFinite(rate) ? Math.round(rate) : 0;
};

const BuyCreditScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();

  const [active, setActive] = useState<ActiveCredit | null>(null);
  const [now, setNow] = useState(Date.now());
  const [plans, setPlans] = useState<PartnerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<PartnerPlan | null>(null);
  const [history, setHistory] = useState<PartnerPlanHistoryItem[]>([]);

  const loadPlans = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        setError(t('buyCredit.errors.sessionNotFound'));
        return;
      }
      const res = await getPartnerPlanList(cookie);
      if (res.Result !== 'Success' || !res.Plans) {
        setError(res.Message || t('buyCredit.errors.loadPlansFailed'));
        return;
      }
      const sorted = [...res.Plans].sort(
        (a, b) => Number(a.PlanTime) - Number(b.PlanTime),
      );
      setPlans(sorted);
    } catch (err: any) {
      setError(err?.message || t('buyCredit.errors.loadPlansFailed'));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // On focus (e.g. returning from PaymentScreen after a purchase): pull
  // active-credit status and recent purchase history together, off a
  // single cookie fetch instead of two separate ones.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const cookie = await getCookie();
        if (!cookie) return;

        const [activeResult, historyRes] = await Promise.all([
          refreshActiveCreditFromServer(cookie),
          getPartnerPlanHistory(cookie).catch(() => null),
        ]);

        setActive(activeResult);
        if (activeResult) {
          const matched = plans.find(
            p => p.PlanTransaction === activeResult.planId,
          );
          if (matched) setJustActivated(matched);
        }

        // History is supplementary — a failed fetch shouldn't affect the
        // active-credit banner or the main plan list above.
        if (
          historyRes &&
          historyRes.Result === 'Success' &&
          historyRes.History
        ) {
          setHistory(historyRes.History);
        }
      })();
    }, [plans]),
  );

  // Purely local 1s tick so "time left" counts down smoothly instead of
  // sitting frozen between focus-triggered server refreshes. No network
  // call — just forces a re-render so activeMsLeft (derived from
  // active.expiresAt) stays current.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const activeMsLeft = active ? Math.max(0, active.expiresAt - now) : 0;

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
        title={t('buyCredit.headerTitle')}
        sub={t('buyCredit.headerSub')}
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
                  ? t('buyCredit.creditActivated', {
                      plan: justActivated.PlanName,
                    })
                  : t('buyCredit.creditActive')}
              </Text>
              <Text style={styles.activeSub}>
                {t('buyCredit.timeLeftSuffix', {
                  timeLeft: formatTimeLeft(activeMsLeft),
                })}
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionLabel}>
            {plans.length
              ? t('buyCredit.plansInRegion', { region: plans[0].Region })
              : t('buyCredit.availablePlans')}
          </Text>
          {plans.length > 0 && (
            <Text style={styles.sectionCount}>
              {t('buyCredit.optionsCount', { count: plans.length })}
            </Text>
          )}
        </View>

        {loading && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Colors.ink} size="small" />
            <Text style={styles.stateText}>{t('buyCredit.loadingPlans')}</Text>
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
              <Text style={styles.retryButtonText}>{t('buyCredit.retry')}</Text>
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
                            {t('buyCredit.bestValue')}
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
                          <Text style={styles.activeBadgeText}>
                            {t('buyCredit.active')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planMeta}>
                      {t('buyCredit.planMeta', {
                        time: plan.PlanTime,
                        hrLabel: t(
                          Number(plan.PlanTime) === 1
                            ? 'buyCredit.hr'
                            : 'buyCredit.hrs',
                        ),
                        rides: plan.PlanRideCount,
                        rate,
                      })}
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
                    <Text style={styles.buyButtonText}>
                      {t('buyCredit.buyNow')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}

        {!loading && !error && plans.length > 0 && (
          <Text style={styles.footNote}>{t('buyCredit.footNote')}</Text>
        )}

        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>
              {t('buyCredit.recentPurchases')}
            </Text>
            {history.slice(0, 5).map((item, i) => (
              <View
                key={item.Transaction || `${item.PlanTran}-${i}`}
                style={[
                  styles.historyRow,
                  i < Math.min(history.length, 5) - 1 &&
                    styles.historyRowDivider,
                ]}
              >
                <View style={styles.flex}>
                  <Text style={styles.historyPlanName}>{item.PlanName}</Text>
                  <Text style={styles.historyMeta}>
                    {item.PlanStartDate} · {item.PlanStartTime}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>₹{item.PlanRate}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {active && (
        <View style={styles.footer}>
          <PrimaryButton
            label={t('buyCredit.doneBackToHome')}
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

  historySection: {
    marginTop: vscale(20),
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vscale(10),
  },
  historyRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  historyPlanName: {
    fontSize: fscale(13),
    fontWeight: '700',
    color: Colors.ink,
  },
  historyMeta: {
    fontSize: fscale(11),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  historyAmount: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
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
    paddingBottom: vscale(44),
    paddingTop: vscale(10),
  },
  fullButton: {
    width: '100%',
  },
});
