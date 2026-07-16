import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import PrimaryButton from '../../components/common/PrimaryButton';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import { RootStackParamList } from '../../navigation/types';
import { sendOtp, verifyOtp, resendOtp } from '../../services/api/authService';
import { resolveProcessingStatus } from '../../services/api/partnerStatus';
import { refineOnboardingRoute } from '../../services/api/resolveOnboardingRoute';
import { saveCookie } from '../../utils/session';
import { TERMS_URL, PRIVACY_URL } from '../../constants/legal';
import { acceptTerms, hasAcceptedCurrentTerms } from '../../utils/terms';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type Stage = 'phone' | 'otp';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 38;

const LoginScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [otpTransaction, setOtpTransaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (stage !== 'otp' || resendIn <= 0) return;
    const t = setInterval(() => setResendIn(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [stage, resendIn]);

  useEffect(() => {
    // Pre-check only if this device already accepted the *current* terms
    // version before (e.g. same partner logging back in) — first-time
    // devices and anyone whose accepted version is stale start unchecked.
    let cancelled = false;
    (async () => {
      const accepted = await hasAcceptedCurrentTerms();
      if (!cancelled && accepted) setTermsAccepted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isPhoneValid = phone.length === 10;
  const isOtpComplete = otp.every(d => d.length === 1);

  const handleSendOtp = async () => {
    if (!isPhoneValid || !termsAccepted || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await sendOtp(phone.trim());
      if (res.Result !== 'Success' || !res.OtpTransaction) {
        // Covers banned/blocked numbers too — the API returns a
        // non-Success Result with a Message explaining why, at this
        // very first step, rather than a separate status field.
        throw new Error(res.Message || 'Could not send OTP. Please try again.');
      }
      setOtpTransaction(res.OtpTransaction);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendIn(RESEND_SECONDS);
      setStage('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 250);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStage('phone');
    setErrorMessage(null);
  };

  const handleResend = async () => {
    if (resendIn > 0 || !otpTransaction || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await resendOtp(otpTransaction);
      if (res.Result !== 'Success') {
        throw new Error(
          res.Message || 'Could not resend OTP. Please try again.',
        );
      }
      if (res.OtpTransaction) setOtpTransaction(res.OtpTransaction);
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendIn(RESEND_SECONDS);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Could not resend OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (errorMessage) setErrorMessage(null);
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isOtpComplete || !otpTransaction || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyOtp(otpTransaction, otp.join(''));
      if (res.Result !== 'Success' || !res.Cookie) {
        // Wrong/expired OTP — clear the boxes and refocus so the partner
        // can immediately retype instead of editing stale digits.
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        throw new Error(res.Message || 'Invalid OTP. Please try again.');
      }

      const initialResolved = resolveProcessingStatus(res.ProcessingStatus);

      if (initialResolved === 'Blocked') {
        // Don't persist the cookie for a banned/rejected account.
        setErrorMessage(
          res.Message ||
            'Your account is not eligible to continue. Please contact support.',
        );
        return;
      }

      await saveCookie(res.Cookie);
      await acceptTerms(res.Cookie);

      const resolved = await refineOnboardingRoute(res.Cookie, initialResolved);

      if (resolved === 'Home') {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else if (resolved === 'Processing') {
        navigation.navigate('ApplicationProcessing');
      } else {
        // 'BasicDetails' — new partner / onboarding required.
        navigation.navigate('BasicDetails');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const timerLabel = `00:${resendIn.toString().padStart(2, '0')}`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TopSafeStrap backgroundColor={Colors.surface} />

        <View style={styles.content}>
          {stage === 'phone' ? (
            <View>
              <View style={styles.appBadge}>
                <View style={styles.appBadgeDot} />
                <Text style={styles.appBadgeText}>Alo Alo Partner App</Text>
              </View>

              <Text style={styles.title}>
                Welcome, partner.{'\n'}Sign in to start driving.
              </Text>
              <Text style={styles.subtitle}>
                We'll send a 4-digit OTP to verify your number.
              </Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Mobile number</Text>
                <View style={styles.phoneInputBox}>
                  <View style={styles.ccGroup}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.ccText}>+91</Text>
                  </View>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={t => {
                      if (errorMessage) setErrorMessage(null);
                      setPhone(t.replace(/[^0-9]/g, '').slice(0, 10));
                    }}
                    placeholder="0000000000"
                    placeholderTextColor={Colors.mute2}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <View style={styles.trustBanner}>
                <ShieldIcon size={17} color={Colors.green} strokeWidth={1.8} />
                <Text style={styles.trustText}>
                  Your number is used only for partner verification.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.termsRow}
                activeOpacity={0.8}
                onPress={() => setTermsAccepted(prev => !prev)}
              >
                <View
                  style={[
                    styles.checkbox,
                    termsAccepted && styles.checkboxChecked,
                  ]}
                >
                  {termsAccepted && (
                    <CheckIcon size={12} color="#FFFFFF" strokeWidth={2.6} />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Linking.openURL(TERMS_URL)}
                  >
                    Partner Terms
                  </Text>{' '}
                  &{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Linking.openURL(PRIVACY_URL)}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.otpBadge}>
                <View style={styles.otpBadgeDot} />
                <Text style={styles.otpBadgeText}>OTP sent to +91 {phone}</Text>
              </View>

              <Text style={styles.title}>Enter the code</Text>
              <View style={styles.otpSubRow}>
                <Text style={styles.subtitle}>4-digit OTP · </Text>
                <TouchableOpacity onPress={handleChangeNumber}>
                  <Text style={styles.changeNumberText}>Change number</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => (otpRefs.current[i] = ref)}
                    style={styles.otpBox}
                    value={digit}
                    onChangeText={t => handleOtpChange(t, i)}
                    onKeyPress={e => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    textContentType={i === 0 ? 'oneTimeCode' : undefined}
                    autoComplete={i === 0 ? 'sms-otp' : 'off'}
                  />
                ))}
              </View>

              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}

              <View style={styles.resendRow}>
                {resendIn > 0 ? (
                  <Text style={styles.resendText}>
                    Resend in{' '}
                    <Text style={styles.resendTime}>{timerLabel}</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={loading}>
                    <Text style={styles.resendActiveText}>
                      {loading ? 'Resending…' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={
              stage === 'phone'
                ? loading
                  ? 'Sending…'
                  : 'Send OTP'
                : loading
                ? 'Verifying…'
                : 'Verify & continue'
            }
            onPress={stage === 'phone' ? handleSendOtp : handleVerify}
            icon="arrowRight"
            disabled={
              loading ||
              (stage === 'phone'
                ? !isPhoneValid || !termsAccepted
                : !isOtpComplete)
            }
            style={styles.fullButton}
          />
          <Text style={styles.legalText}>
            By continuing you agree to our{' '}
            <Text
              style={styles.legalStrong}
              onPress={() => Linking.openURL(TERMS_URL)}
            >
              Partner Terms
            </Text>{' '}
            &{' '}
            <Text
              style={styles.legalStrong}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topRow: {
    paddingTop: vscale(24),
    paddingHorizontal: hscale(24),
  },
  backButton: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(14),
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: hscale(28),
    paddingTop: vscale(28),
  },
  appBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    paddingVertical: vscale(5),
    paddingHorizontal: hscale(10),
    borderRadius: 99,
    backgroundColor: 'rgba(200,242,96,0.18)',
    marginBottom: vscale(16),
  },
  appBadgeDot: {
    width: hscale(7),
    height: hscale(7),
    borderRadius: hscale(4),
    backgroundColor: Colors.ink,
  },
  appBadgeText: {
    fontSize: fscale(11.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  title: {
    fontSize: fscale(30),
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.ink,
    lineHeight: fscale(33),
  },
  subtitle: {
    marginTop: vscale(10),
    fontSize: fscale(14),
    color: Colors.mute,
    lineHeight: fscale(21),
  },
  errorText: {
    marginTop: vscale(10),
    fontSize: fscale(12.5),
    color: Colors.red,
    fontWeight: '600',
  },
  fieldBlock: {
    marginTop: vscale(32),
  },
  fieldLabel: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vscale(10),
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    paddingVertical: vscale(14),
    paddingHorizontal: hscale(16),
    borderRadius: hscale(18),
    borderWidth: 1.5,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
  },
  ccGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(7),
  },
  flag: {
    fontSize: fscale(20),
  },
  ccText: {
    fontSize: fscale(15),
    fontWeight: '700',
    color: Colors.ink,
  },
  divider: {
    width: 1,
    height: vscale(22),
    backgroundColor: Colors.line,
  },
  phoneInput: {
    flex: 1,
    fontSize: fscale(18),
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.ink,
    padding: 0,
  },
  trustBanner: {
    marginTop: vscale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    paddingVertical: vscale(12),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(14),
    backgroundColor: 'rgba(200,242,96,0.1)',
  },
  trustText: {
    flex: 1,
    fontSize: fscale(12.5),
    color: Colors.ink2,
    lineHeight: fscale(17),
  },
  termsRow: {
    marginTop: vscale(16),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: hscale(10),
  },
  checkbox: {
    width: hscale(20),
    height: hscale(20),
    borderRadius: hscale(6),
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vscale(1),
  },
  checkboxChecked: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  termsText: {
    flex: 1,
    fontSize: fscale(12.5),
    color: Colors.ink2,
    lineHeight: fscale(18),
  },
  termsLink: {
    color: Colors.blue,
    fontWeight: '600',
  },
  otpBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(7),
    paddingVertical: vscale(6),
    paddingHorizontal: hscale(12),
    borderRadius: 99,
    backgroundColor: 'rgba(31,157,107,0.1)',
    marginBottom: vscale(20),
  },
  otpBadgeDot: {
    width: hscale(7),
    height: hscale(7),
    borderRadius: hscale(4),
    backgroundColor: Colors.green,
  },
  otpBadgeText: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.green,
  },
  otpSubRow: {
    marginTop: vscale(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeNumberText: {
    fontSize: fscale(14),
    fontWeight: '600',
    color: Colors.blue,
  },
  otpRow: {
    marginTop: vscale(32),
    flexDirection: 'row',
    gap: hscale(8),
  },
  otpBox: {
    flex: 1,
    height: vscale(62),
    borderRadius: hscale(18),
    backgroundColor: Colors.ink,
    fontSize: fscale(26),
    fontWeight: '800',
    color: Colors.lime,
    padding: 0,
  },
  resendRow: {
    marginTop: vscale(24),
    alignItems: 'center',
  },
  resendText: {
    fontSize: fscale(13.5),
    color: Colors.mute,
  },
  resendTime: {
    color: Colors.ink,
    fontWeight: '700',
  },
  resendActiveText: {
    fontSize: fscale(13.5),
    color: Colors.blue,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(44),
    paddingTop: vscale(16),
  },
  fullButton: {
    width: '100%',
  },
  legalText: {
    marginTop: vscale(14),
    fontSize: fscale(11.5),
    color: Colors.mute2,
    textAlign: 'center',
    lineHeight: fscale(17),
  },
  legalStrong: {
    color: Colors.ink,
    fontWeight: '600',
  },
});
