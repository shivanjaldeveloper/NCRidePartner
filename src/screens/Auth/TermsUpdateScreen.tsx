import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale, safeLineHeight } from '../../theme/scale';
import TopSafeStrap from '../../components/layout/TopSafeStrap';
import PrimaryButton from '../../components/common/PrimaryButton';
import CheckIcon from '../../assets/icons/CheckIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import { RootStackParamList } from '../../navigation/types';
import { TERMS_URL, PRIVACY_URL } from '../../constants/legal';
import { acceptTerms } from '../../utils/terms';
import { getCookie, clearCookie } from '../../utils/session';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'TermsUpdate'>;

/**
 * Shown only to already-logged-in partners (valid cookie) whose locally
 * stored terms version no longer matches TERMS_VERSION — i.e. the Terms or
 * Privacy Policy changed since they last agreed. Splash routes here instead
 * of Home in that case; Login handles first-time / logged-out acceptance.
 */
const TermsUpdateScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!checked || loading) return;
    setLoading(true);
    try {
      const cookie = await getCookie();
      await acceptTerms(cookie || undefined);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    // Can't stay signed in without accepting the current terms — same
    // clear-cookie-and-reset-to-Splash pattern as LogoutScreen.
    await clearCookie();
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  return (
    <View style={styles.container}>
      <TopSafeStrap backgroundColor={Colors.surface} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <ShieldIcon size={30} color={Colors.green} strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>{t('termsUpdate.title')}</Text>
        <Text style={styles.subtitle}>{t('termsUpdate.subtitle')}</Text>

        <TouchableOpacity
          style={styles.checkRow}
          activeOpacity={0.8}
          onPress={() => setChecked(c => !c)}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && (
              <CheckIcon size={13} color="#FFFFFF" strokeWidth={2.6} />
            )}
          </View>
          <Text style={styles.checkText}>
            {t('termsUpdate.agreePrefix')}{' '}
            <Text
              style={styles.checkLink}
              onPress={() => Linking.openURL(TERMS_URL)}
            >
              {t('termsUpdate.termsLink')}
            </Text>{' '}
            {t('termsUpdate.and')}{' '}
            <Text
              style={styles.checkLink}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              {t('termsUpdate.privacyLink')}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={
            loading ? t('termsUpdate.saving') : t('termsUpdate.acceptContinue')
          }
          onPress={handleAccept}
          icon="arrowRight"
          disabled={!checked || loading}
          style={styles.fullButton}
        />
        <TouchableOpacity
          onPress={handleDecline}
          disabled={loading}
          style={styles.declineButton}
        >
          <Text style={styles.declineText}>
            {t('termsUpdate.declineLogout')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TermsUpdateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: hscale(28),
    paddingTop: vscale(40),
  },
  iconCircle: {
    width: hscale(64),
    height: hscale(64),
    borderRadius: hscale(20),
    backgroundColor: 'rgba(31,157,107,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vscale(20),
  },
  title: {
    fontSize: fscale(26),
    fontWeight: '800',
    letterSpacing: -0.8,
    color: Colors.ink,
    lineHeight: safeLineHeight(fscale(26)),
  },
  subtitle: {
    marginTop: vscale(10),
    fontSize: fscale(14),
    color: Colors.mute,
    lineHeight: fscale(21),
  },
  checkRow: {
    marginTop: vscale(32),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: hscale(12),
  },
  checkbox: {
    width: hscale(22),
    height: hscale(22),
    borderRadius: hscale(7),
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
  checkText: {
    flex: 1,
    fontSize: fscale(13.5),
    color: Colors.ink2,
    lineHeight: fscale(20),
  },
  checkLink: {
    color: Colors.blue,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(44),
    paddingTop: vscale(16),
  },
  fullButton: {
    width: '100%',
  },
  declineButton: {
    marginTop: vscale(16),
    alignItems: 'center',
  },
  declineText: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.mute,
  },
});
