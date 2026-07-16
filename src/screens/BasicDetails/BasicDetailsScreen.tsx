import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import PrimaryButton from '../../components/common/PrimaryButton';
import ChevronLeftIcon from '../../assets/icons/ChevronLeftIcon';
import { RootStackParamList } from '../../navigation/types';
import { updateOnboardingProfile } from '../../services/api/authService';
import { updateReferredBy } from '../../services/api/onboardingService';
import { getCookie, clearCookie } from '../../utils/session';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'BasicDetails'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BasicDetailsScreen = () => {
  const navigation = useNavigation<NavProp>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isNameValid = name.trim().length >= 2;
  const isEmailValid = EMAIL_RE.test(email.trim());
  const isValid = isNameValid && isEmailValid;

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const res = await updateOnboardingProfile(
        cookie,
        name.trim(),
        email.trim(),
      );
      if (res.Result !== 'Success') {
        throw new Error(
          res.Message || 'Could not save your details. Please try again.',
        );
      }

      // Referral code is optional — a failure here shouldn't block the
      // rest of onboarding, just surface it and let them continue.
      if (referredBy.trim()) {
        try {
          const refRes = await updateReferredBy(cookie, referredBy.trim());
          if (refRes.Result !== 'Success') {
            console.warn(
              '[BasicDetails] Referral update failed:',
              refRes.Message,
            );
          }
        } catch (refErr) {
          console.warn('[BasicDetails] Referral update failed:', refErr);
        }
      }

      navigation.navigate('PartnerDocuments');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TopSafeStrap backgroundColor={Colors.surface} />

        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={async () => {
              // A cookie already exists at this point (set right after
              // OTP verify), and the server still sees this partner as
              // mid-onboarding — so on its own, a restart would just land
              // back here again via Splash's routing. Clearing the cookie
              // here means "back" really means back: next launch goes to
              // Login, not straight back into BasicDetails.
              await clearCookie();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeftIcon size={20} color={Colors.ink} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepBadge}>
            <View style={styles.stepBadgeDot} />
            <Text style={styles.stepBadgeText}>Step 1 of 2 · Onboarding</Text>
          </View>

          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>
            We'll use these details on your partner profile.
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={t => {
                  if (errorMessage) setErrorMessage(null);
                  setName(t);
                }}
                placeholder="Your full name"
                placeholderTextColor={Colors.mute2}
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={t => {
                  if (errorMessage) setErrorMessage(null);
                  setEmail(t);
                }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.mute2}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Referral code (optional)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={referredBy}
                onChangeText={setReferredBy}
                placeholder="Partner ID who referred you"
                placeholderTextColor={Colors.mute2}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={loading ? 'Saving…' : 'Continue'}
            onPress={handleContinue}
            icon="arrowRight"
            disabled={loading || !isValid}
            style={styles.fullButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default BasicDetailsScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    paddingHorizontal: hscale(28),
    paddingTop: vscale(28),
    paddingBottom: vscale(20),
  },
  stepBadge: {
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
  stepBadgeDot: {
    width: hscale(7),
    height: hscale(7),
    borderRadius: hscale(4),
    backgroundColor: Colors.ink,
  },
  stepBadgeText: {
    fontSize: fscale(11.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  title: {
    fontSize: fscale(28),
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.ink,
  },
  subtitle: {
    marginTop: vscale(8),
    fontSize: fscale(14),
    color: Colors.mute,
    lineHeight: fscale(21),
  },
  errorText: {
    marginTop: vscale(4),
    fontSize: fscale(12.5),
    color: Colors.red,
    fontWeight: '600',
  },
  fieldBlock: {
    marginTop: vscale(24),
  },
  fieldLabel: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vscale(10),
  },
  inputBox: {
    paddingVertical: vscale(14),
    paddingHorizontal: hscale(16),
    borderRadius: hscale(18),
    borderWidth: 1.5,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
  },
  input: {
    fontSize: fscale(15.5),
    fontWeight: '600',
    color: Colors.ink,
    padding: 0,
  },
  footer: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(44),
    paddingTop: vscale(16),
  },
  fullButton: {
    width: '100%',
  },
});
