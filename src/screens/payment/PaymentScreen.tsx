import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import RazorpayCheckout from 'react-native-razorpay';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale, safeLineHeight } from '../../theme/scale';
import { RootStackParamList } from '../../navigation/types';
import { activateCreditDemo } from '../../utils/credit';
import { RAZORPAY_KEY_ID } from '../../constants/razorpay';
import { createRazorpayOrder_DEV_ONLY } from '../../services/api/razorpayOrderService';
import { getCookie } from '../../utils/session';
import { getProfile } from '../../services/api/authService';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import WheelLogoIcon from '../../assets/icons/WheelLogoIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import UpiIcon from '../../assets/icons/UpiIcon';
import CardIcon from '../../assets/icons/CardIcon';
import BankIcon from '../../assets/icons/BankIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import ClockIcon from '../../assets/icons/ClockIcon';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;
type Route = RouteProp<RootStackParamList, 'Payment'>;

type Stage = 'form' | 'processing' | 'success';

const PaymentScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<Route>();
  const { planId, planName, planTime, planRate } = params;
  const { t } = useTranslation();

  const [stage, setStage] = useState<Stage>('form');
  const [payError, setPayError] = useState<string | null>(null);

  const successScale = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage === 'processing' || stage === 'success') {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      overlayOpacity.setValue(0);
    }
  }, [stage, overlayOpacity]);

  useEffect(() => {
    if (stage !== 'success') return;
    Animated.timing(successScale, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.navigate('MainTabs');
    }, 1300);
    return () => clearTimeout(timer);
  }, [stage, successScale, navigation]);

  const handlePay = async () => {
    if (stage !== 'form') return;
    setPayError(null);
    setStage('processing');

    try {
      // Best-effort partner details for the order notes — falls back
      // quietly if the profile call fails or fields are missing, since a
      // failed profile lookup shouldn't block a test payment.
      let partnerName = 'Partner';
      let partnerMobile = 'NA';
      try {
        const cookie = await getCookie();
        if (cookie) {
          const profile = await getProfile(cookie);
          partnerName = profile?.Name || profile?.Username || partnerName;
          partnerMobile = profile?.Mobile || profile?.Username || partnerMobile;
        }
      } catch {
        // ignore — order still goes through with the fallback values above
      }

      // Step 1: create the order. DEV-ONLY — see razorpayOrderService.ts
      // banner. Swap createRazorpayOrder_DEV_ONLY for your backend's real
      // "create order" endpoint once it exists; nothing below this line
      // needs to change.
      let order;
      try {
        order = await createRazorpayOrder_DEV_ONLY({
          amountRupees: planRate,
          // Razorpay caps `receipt` at 40 chars — planId can be long
          // (GUID-style), so keep only its last 8 chars plus a base36
          // timestamp instead of concatenating everything raw.
          receipt: `P${Date.now().toString(36)}${planId.slice(-8)}`,
          notes: {
            'Partner Mobile Number': partnerMobile,
            'Partner Name': partnerName,
            // TODO: swap for the real partner reference field once
            // confirmed with the backend team — Username is a placeholder.
            'Partner Tran': partnerName,
            'Plan Name': planName,
          },
        });
      } catch (e: any) {
        throw new Error(`[create-order] ${e?.message || e}`);
      }

      // Step 2: real Razorpay Checkout, pinned to that order — this is
      // what stops a client from paying a different amount than the
      // server actually requested.
      let result;
      try {
        result = await RazorpayCheckout.open({
          key: RAZORPAY_KEY_ID,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          name: 'NCRide Partner',
          description: `${planName} · ${planTime} hr credit`,
          theme: { color: Colors.ink },
          prefill: {
            name: partnerName,
            contact: partnerMobile !== 'NA' ? partnerMobile : undefined,
          },
        });
      } catch (e: any) {
        throw new Error(
          `[checkout] ${e?.description || e?.message || 'cancelled'}`,
        );
      }

      // Step 3: verify. DEV-ONLY stub — this just trusts Checkout's
      // result for now. Real verification means recomputing
      // HMAC-SHA256 of `${razorpay_order_id}|${razorpay_payment_id}`
      // using the key SECRET and comparing it to razorpay_signature,
      // which can only be done safely on a server (it needs the
      // secret). Once the backend exposes a verify endpoint, replace
      // the line below with a call to it, e.g.:
      //   const res = await postAuthForm('VerifyRazorpayPayment', {
      //     cookie,
      //     razorpay_order_id: result.razorpay_order_id,
      //     razorpay_payment_id: result.razorpay_payment_id,
      //     razorpay_signature: result.razorpay_signature,
      //     planTransaction: planId,
      //   }, API_PLANS_BASE_URL);
      //   const verified = res.Result === 'Success';
      try {
        const verified = !!result?.razorpay_payment_id;
        if (!verified) throw new Error('no payment id returned');
      } catch (e: any) {
        throw new Error(`[verify] ${e?.message || e}`);
      }

      // DEMO: activates the credit window locally, same as before — swap
      // for whatever your backend does once payment is verified there.
      try {
        await activateCreditDemo(planId, planTime);
      } catch (e: any) {
        throw new Error(`[activate] ${e?.message || e}`);
      }

      setStage('success');
    } catch (err: any) {
      setStage('form');
      // Log the raw error so it shows up in Metro/logcat/Xcode console —
      // the message shown to the user is intentionally generic, but this
      // is what actually tells us why it failed.
      console.warn('[Razorpay] payment flow failed:', err?.message, err?.stack);
      const code = err?.code;
      const description =
        err?.description || err?.error?.description || err?.message;
      setPayError(
        description
          ? `${description}${code ? ` (code ${code})` : ''}`
          : t('payment.errors.cancelledOrFailed'),
      );
    }
  };

  const handleClose = () => {
    if (stage === 'processing') return;
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.merchantRow}>
            <View style={styles.merchantLogo}>
              <WheelLogoIcon size={22} color={Colors.lime} />
            </View>
            <View>
              <Text style={styles.merchantName}>NCRide Partner</Text>
              <View style={styles.trustedRow}>
                <ShieldIcon size={11} color={Colors.lime} strokeWidth={2} />
                <Text style={styles.trustedText}>
                  {t('payment.securedByRazorpay')}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            activeOpacity={0.8}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.testModeBadge}>
          <View style={styles.testModeDot} />
          <Text style={styles.testModeText}>{t('payment.testMode')}</Text>
        </View>

        <Text style={styles.amountLabel}>{t('payment.amountPayable')}</Text>
        <Text style={styles.amountValue}>₹{planRate}</Text>
      </View>

      <View style={styles.sheet}>
        <Card pad={16} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <ClockIcon size={16} color={Colors.ink} strokeWidth={1.8} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.summaryTitle}>{planName}</Text>
              <Text style={styles.summarySub}>
                {t('payment.creditDuration', {
                  time: planTime,
                  hrLabel: t(planTime === 1 ? 'buyCredit.hr' : 'buyCredit.hrs'),
                })}
              </Text>
            </View>
            <Text style={styles.summaryAmount}>₹{planRate}</Text>
          </View>
        </Card>

        <Text style={styles.methodsLabel}>
          {t('payment.allMethodsSupported')}
        </Text>
        <View style={styles.methodsRow}>
          <View style={styles.methodIconWrap}>
            <UpiIcon size={16} color={Colors.ink} strokeWidth={1.8} />
          </View>
          <View style={styles.methodIconWrap}>
            <CardIcon size={16} color={Colors.ink} strokeWidth={1.8} />
          </View>
          <View style={styles.methodIconWrap}>
            <BankIcon size={16} color={Colors.ink} strokeWidth={1.8} />
          </View>
          <View style={styles.methodIconWrap}>
            <WalletIcon size={16} color={Colors.ink} strokeWidth={1.8} />
          </View>
          <Text style={styles.methodsCaption}>
            {t('payment.methodsCaption')}
          </Text>
        </View>

        <View style={styles.secureNote}>
          <ShieldIcon size={14} color={Colors.mute} strokeWidth={1.8} />
          <Text style={styles.secureNoteText}>{t('payment.secureNote')}</Text>
        </View>

        {!!payError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{payError}</Text>
          </View>
        )}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              stage === 'processing' && styles.payButtonDisabled,
            ]}
            activeOpacity={0.88}
            disabled={stage === 'processing'}
            onPress={handlePay}
          >
            <Text style={styles.payButtonText}>
              {t('payment.paySecurely', { amount: planRate })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={stage === 'processing' || stage === 'success'}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[styles.overlayCard, { opacity: overlayOpacity }]}
          >
            {stage === 'processing' ? (
              <>
                <Spinner size={30} color={Colors.ink} />
                <Text style={styles.overlayTitle}>
                  {t('payment.processingPayment')}
                </Text>
                <Text style={styles.overlaySub}>
                  {t('payment.confirmingNote')}
                </Text>
              </>
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.successCircle,
                    { transform: [{ scale: successScale }] },
                  ]}
                >
                  <CheckIcon size={26} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
                <Text style={styles.overlayTitle}>
                  {t('payment.paymentSuccessful')}
                </Text>
                <Text style={styles.overlaySub}>
                  {t('payment.creditNowActive', { plan: planName })}
                </Text>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.ink,
    paddingTop: vscale(52),
    paddingHorizontal: hscale(20),
    paddingBottom: vscale(26),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
  },
  merchantLogo: {
    width: hscale(38),
    height: hscale(38),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: fscale(15),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trustedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(4),
    marginTop: vscale(2),
  },
  trustedText: {
    fontSize: fscale(10.5),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  closeButton: {
    width: hscale(32),
    height: hscale(32),
    borderRadius: hscale(11),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testModeBadge: {
    marginTop: vscale(18),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: hscale(6),
    paddingVertical: vscale(5),
    paddingHorizontal: hscale(9),
    borderRadius: hscale(8),
    backgroundColor: 'rgba(200,242,96,0.14)',
  },
  testModeDot: {
    width: hscale(5),
    height: hscale(5),
    borderRadius: hscale(2.5),
    backgroundColor: Colors.lime,
  },
  testModeText: {
    fontSize: fscale(10),
    fontWeight: '700',
    color: Colors.lime,
    letterSpacing: 0.2,
  },
  amountLabel: {
    marginTop: vscale(16),
    fontSize: fscale(12),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: fscale(34),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginTop: vscale(2),
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: hscale(26),
    borderTopRightRadius: hscale(26),
    paddingHorizontal: hscale(18),
    paddingTop: vscale(20),
  },
  summaryCard: {
    marginBottom: vscale(18),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  summaryIconWrap: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(12),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: fscale(14.5),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  summarySub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  summaryAmount: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: Colors.ink,
  },
  methodsLabel: {
    fontSize: fscale(11.5),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: vscale(10),
  },
  methodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
    marginBottom: vscale(18),
  },
  methodIconWrap: {
    width: hscale(34),
    height: hscale(34),
    borderRadius: hscale(11),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodsCaption: {
    marginLeft: hscale(4),
    flex: 1,
    fontSize: fscale(11),
    color: Colors.mute2,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    gap: hscale(10),
    padding: hscale(14),
    borderRadius: hscale(14),
    backgroundColor: Colors.bg,
  },
  secureNoteText: {
    flex: 1,
    fontSize: fscale(11.5),
    color: Colors.mute,
    lineHeight: safeLineHeight(fscale(11.5)),
  },
  errorBanner: {
    marginTop: vscale(14),
    padding: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(224,82,78,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(224,82,78,0.25)',
  },
  errorBannerText: {
    fontSize: fscale(12),
    color: Colors.red,
    fontWeight: '600',
    lineHeight: safeLineHeight(fscale(12)),
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: vscale(44),
    paddingTop: vscale(14),
  },
  payButton: {
    height: vscale(56),
    borderRadius: hscale(18),
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: fscale(15.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,17,21,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hscale(40),
  },
  overlayCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: hscale(22),
    paddingVertical: vscale(30),
    paddingHorizontal: hscale(24),
    alignItems: 'center',
    gap: vscale(10),
  },
  successCircle: {
    width: hscale(54),
    height: hscale(54),
    borderRadius: hscale(27),
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vscale(2),
  },
  overlayTitle: {
    fontSize: fscale(15),
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
  },
  overlaySub: {
    fontSize: fscale(12),
    color: Colors.mute,
    textAlign: 'center',
    lineHeight: safeLineHeight(fscale(12)),
  },
});
