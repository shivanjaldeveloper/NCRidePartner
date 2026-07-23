import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale, safeLineHeight } from '../../theme/scale';
import { RootStackParamList } from '../../navigation/types';
import { activateCreditDemo } from '../../utils/credit';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Spinner from '../../components/common/Spinner';
import WheelLogoIcon from '../../assets/icons/WheelLogoIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import UpiIcon from '../../assets/icons/UpiIcon';
import CardIcon from '../../assets/icons/CardIcon';
import BankIcon from '../../assets/icons/BankIcon';
import WalletIcon from '../../assets/icons/WalletIcon';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;
type Route = RouteProp<RootStackParamList, 'Payment'>;

type Method = 'upi' | 'card' | 'netbanking' | 'wallet';
type Stage = 'form' | 'processing' | 'success';

const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay', tint: '#EAF2FF', fg: Colors.blue },
  { id: 'phonepe', label: 'PhonePe', tint: '#F1E9FF', fg: '#5F259F' },
  { id: 'paytm', label: 'Paytm', tint: '#E7F1FF', fg: '#00253C' },
];

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'];

const WALLETS = [
  { id: 'paytm', label: 'Paytm Wallet' },
  { id: 'amazonpay', label: 'Amazon Pay' },
  { id: 'mobikwik', label: 'MobiKwik' },
];

// Groups digits as "1234 5678 9012 3456" as the user types.
const formatCardNumber = (v: string) =>
  v
    .replace(/[^0-9]/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (v: string) => {
  const digits = v.replace(/[^0-9]/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const PaymentScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<Route>();
  const { planId, planName, planTime, planRate } = params;

  const [method, setMethod] = useState<Method>('upi');
  const [stage, setStage] = useState<Stage>('form');

  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const successScale = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage === 'processing' || stage === 'success') {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [stage, overlayOpacity]);

  useEffect(() => {
    if (stage !== 'success') return;
    Animated.sequence([
      Animated.timing(successScale, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.goBack();
    }, 1300);
    return () => clearTimeout(timer);
  }, [stage, successScale, navigation]);

  const isValid = useMemo(() => {
    if (method === 'upi') {
      return !!selectedUpiApp || upiId.includes('@');
    }
    if (method === 'card') {
      return (
        cardNumber.replace(/\s/g, '').length >= 12 &&
        cardExpiry.length === 5 &&
        cardCvv.length >= 3
      );
    }
    if (method === 'netbanking') return !!selectedBank;
    return !!selectedWallet;
  }, [
    method,
    selectedUpiApp,
    upiId,
    cardNumber,
    cardExpiry,
    cardCvv,
    selectedBank,
    selectedWallet,
  ]);

  const handlePay = async () => {
    if (!isValid || stage !== 'form') return;
    setStage('processing');
    // TEST MODE — simulates the Razorpay test-card/UPI success flow. Swap
    // this timeout + activateCreditDemo() for a real order-create + verify
    // call once a payment/billing API exists; the plan id and hours are
    // already threaded through and ready to send.
    await new Promise(resolve => setTimeout(resolve, 1600));
    await activateCreditDemo(planId, planTime);
    setStage('success');
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
                <Text style={styles.trustedText}>Trusted Business</Text>
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
          <Text style={styles.testModeText}>
            TEST MODE — no real money moves
          </Text>
        </View>

        <Text style={styles.amountLabel}>Amount payable</Text>
        <Text style={styles.amountValue}>₹{planRate}</Text>
        <Text style={styles.planSub}>
          {planName} · {planTime} hr{planTime === 1 ? '' : 's'} credit
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={vscale(20)}
      >
        <View style={styles.sheet}>
          <View style={styles.tabsWrap}>
            <SegmentedTabs
              options={[
                { id: 'upi', label: 'UPI' },
                { id: 'card', label: 'Cards' },
                { id: 'netbanking', label: 'Netbanking' },
                { id: 'wallet', label: 'Wallet' },
              ]}
              value={method}
              onChange={id => setMethod(id as Method)}
            />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {method === 'upi' && (
              <View>
                <Text style={styles.groupLabel}>Pay via UPI app</Text>
                {UPI_APPS.map(app => {
                  const active = selectedUpiApp === app.id;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      activeOpacity={0.75}
                      style={[
                        styles.optionRow,
                        active && styles.optionRowActive,
                      ]}
                      onPress={() => {
                        setSelectedUpiApp(app.id);
                        setUpiId('');
                      }}
                    >
                      <View
                        style={[
                          styles.optionIconWrap,
                          { backgroundColor: app.tint },
                        ]}
                      >
                        <UpiIcon size={16} color={app.fg} strokeWidth={2} />
                      </View>
                      <Text style={styles.optionLabel}>{app.label}</Text>
                      <View
                        style={[
                          styles.radioOuter,
                          active && styles.radioOuterActive,
                        ]}
                      >
                        {active && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <Text style={[styles.groupLabel, styles.groupLabelSpaced]}>
                  Or enter UPI ID
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@upi"
                    placeholderTextColor={Colors.mute2}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={upiId}
                    onChangeText={v => {
                      setUpiId(v);
                      setSelectedUpiApp(null);
                    }}
                  />
                </View>
                <Text style={styles.hintText}>
                  Test mode: any value with "@" works, e.g. success@upi
                </Text>
              </View>
            )}

            {method === 'card' && (
              <View>
                <Text style={styles.groupLabel}>Card details</Text>
                <View style={styles.inputRow}>
                  <CardIcon size={16} color={Colors.mute} strokeWidth={1.8} />
                  <TextInput
                    style={styles.input}
                    placeholder="Card number"
                    placeholderTextColor={Colors.mute2}
                    keyboardType="number-pad"
                    value={cardNumber}
                    onChangeText={v => setCardNumber(formatCardNumber(v))}
                    maxLength={19}
                  />
                </View>
                <View style={styles.rowGap}>
                  <View style={[styles.inputRow, styles.inputHalf]}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={Colors.mute2}
                      keyboardType="number-pad"
                      value={cardExpiry}
                      onChangeText={v => setCardExpiry(formatExpiry(v))}
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.inputRow, styles.inputHalf]}>
                    <TextInput
                      style={styles.input}
                      placeholder="CVV"
                      placeholderTextColor={Colors.mute2}
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={v =>
                        setCardCvv(v.replace(/[^0-9]/g, '').slice(0, 3))
                      }
                      maxLength={3}
                    />
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Name on card"
                    placeholderTextColor={Colors.mute2}
                    value={cardName}
                    onChangeText={setCardName}
                  />
                </View>

                <View style={styles.saveCardRow}>
                  <Text style={styles.saveCardText}>Save card for later</Text>
                  <ToggleSwitch value={saveCard} onChange={setSaveCard} />
                </View>
                <Text style={styles.hintText}>
                  Test mode: any 12+ digit number, future expiry &amp; any CVV
                  works
                </Text>
              </View>
            )}

            {method === 'netbanking' && (
              <View>
                <Text style={styles.groupLabel}>Select your bank</Text>
                {BANKS.map(bank => {
                  const active = selectedBank === bank;
                  return (
                    <TouchableOpacity
                      key={bank}
                      activeOpacity={0.75}
                      style={[
                        styles.optionRow,
                        active && styles.optionRowActive,
                      ]}
                      onPress={() => setSelectedBank(bank)}
                    >
                      <View style={styles.optionIconWrap}>
                        <BankIcon
                          size={16}
                          color={Colors.ink}
                          strokeWidth={1.8}
                        />
                      </View>
                      <Text style={styles.optionLabel}>{bank}</Text>
                      <View
                        style={[
                          styles.radioOuter,
                          active && styles.radioOuterActive,
                        ]}
                      >
                        {active && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {method === 'wallet' && (
              <View>
                <Text style={styles.groupLabel}>Pay via wallet</Text>
                {WALLETS.map(w => {
                  const active = selectedWallet === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      activeOpacity={0.75}
                      style={[
                        styles.optionRow,
                        active && styles.optionRowActive,
                      ]}
                      onPress={() => setSelectedWallet(w.id)}
                    >
                      <View style={styles.optionIconWrap}>
                        <WalletIcon
                          size={16}
                          color={Colors.ink}
                          strokeWidth={1.8}
                        />
                      </View>
                      <Text style={styles.optionLabel}>{w.label}</Text>
                      <View
                        style={[
                          styles.radioOuter,
                          active && styles.radioOuterActive,
                        ]}
                      >
                        {active && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.secureRow}>
              <ShieldIcon size={12} color={Colors.mute2} strokeWidth={2} />
              <Text style={styles.secureText}>
                100% secure payments · test checkout
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.payButton, !isValid && styles.payButtonDisabled]}
              activeOpacity={0.88}
              disabled={!isValid}
              onPress={handlePay}
            >
              <Text style={styles.payButtonText}>Pay ₹{planRate}</Text>
              <ChevronRightIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {stage !== 'form' && (
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="auto"
        >
          <View style={styles.overlayCard}>
            {stage === 'processing' ? (
              <>
                <Spinner size={30} color={Colors.lime} />
                <Text style={styles.overlayTitle}>Processing payment</Text>
                <Text style={styles.overlaySub}>
                  Confirming with your bank — don't close this screen
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
                <Text style={styles.overlayTitle}>Payment successful</Text>
                <Text style={styles.overlaySub}>
                  {planName} credit is now active
                </Text>
              </>
            )}
          </View>
        </Animated.View>
      )}
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
    paddingBottom: vscale(22),
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
  planSub: {
    fontSize: fscale(12.5),
    color: 'rgba(255,255,255,0.55)',
    marginTop: vscale(4),
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: hscale(26),
    borderTopRightRadius: hscale(26),
    overflow: 'hidden',
  },
  tabsWrap: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(18),
    paddingBottom: vscale(6),
  },
  scrollContent: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(14),
    paddingBottom: vscale(24),
  },
  groupLabel: {
    fontSize: fscale(11.5),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: vscale(10),
  },
  groupLabelSpaced: {
    marginTop: vscale(18),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(12),
    borderRadius: hscale(14),
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: vscale(9),
    backgroundColor: Colors.surface,
  },
  optionRowActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.bg,
  },
  optionIconWrap: {
    width: hscale(34),
    height: hscale(34),
    borderRadius: hscale(11),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  radioOuter: {
    width: hscale(20),
    height: hscale(20),
    borderRadius: hscale(10),
    borderWidth: 1.6,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.ink,
  },
  radioInner: {
    width: hscale(10),
    height: hscale(10),
    borderRadius: hscale(5),
    backgroundColor: Colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: hscale(14),
    paddingHorizontal: hscale(14),
    height: vscale(50),
    marginBottom: vscale(10),
    backgroundColor: Colors.surface,
  },
  inputHalf: {
    flex: 1,
  },
  rowGap: {
    flexDirection: 'row',
    gap: hscale(10),
  },
  input: {
    flex: 1,
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
    padding: 0,
  },
  hintText: {
    fontSize: fscale(11),
    color: Colors.mute2,
    lineHeight: safeLineHeight(fscale(11)),
  },
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vscale(6),
    marginBottom: vscale(8),
  },
  saveCardText: {
    fontSize: fscale(13),
    fontWeight: '600',
    color: Colors.ink,
  },
  footer: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(10),
    paddingBottom: vscale(44),
    borderTopWidth: 0.5,
    borderTopColor: Colors.line2,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    marginBottom: vscale(10),
  },
  secureText: {
    fontSize: fscale(10.5),
    color: Colors.mute2,
    fontWeight: '600',
  },
  payButton: {
    height: vscale(54),
    borderRadius: hscale(16),
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
    opacity: 0.4,
  },
  payButtonText: {
    fontSize: fscale(15.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
