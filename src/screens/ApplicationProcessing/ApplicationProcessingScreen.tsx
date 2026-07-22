import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import PrimaryButton from '../../components/common/PrimaryButton';
import ClockIcon from '../../assets/icons/ClockIcon';
import LogoutIcon from '../../assets/icons/LogoutIcon';
import { RootStackParamList } from '../../navigation/types';
import { getCookie, clearCookie } from '../../utils/session';
import { getProcessingDetails } from '../../services/api/onboardingService';
import { resolveProcessingStatus } from '../../services/api/partnerStatus';

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ApplicationProcessing'
>;

const ApplicationProcessingScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    if (checking) return;
    setChecking(true);
    setNote(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const res = await getProcessingDetails(cookie);
      if (res.Result !== 'Success') {
        await clearCookie();
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const resolved = resolveProcessingStatus(res.ProcessingStatus);
      if (resolved === 'Home') {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else if (resolved === 'Blocked') {
        await clearCookie();
        setNote(
          res.Remark
            ? t('applicationProcessing.notes.rejected', { remark: res.Remark })
            : t('applicationProcessing.notes.notApproved'),
        );
      } else {
        setNote(
          res.Remark
            ? t('applicationProcessing.notes.underReview', {
                remark: res.Remark,
              })
            : t('applicationProcessing.notes.underReviewDefault'),
        );
      }
    } catch {
      setNote(t('applicationProcessing.notes.checkFailed'));
    } finally {
      setChecking(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Logout')}
        >
          <LogoutIcon size={15} color={Colors.red} strokeWidth={1.8} />
          <Text style={styles.logoutText}>
            {t('applicationProcessing.logout')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconRing}>
          <ClockIcon size={30} color={Colors.ink} strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>{t('applicationProcessing.title')}</Text>
        <Text style={styles.message}>{t('applicationProcessing.message')}</Text>

        {note && <Text style={styles.note}>{note}</Text>}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={
            checking
              ? t('applicationProcessing.checking')
              : t('applicationProcessing.checkStatus')
          }
          onPress={handleCheckStatus}
          icon="none"
          disabled={checking}
          style={styles.fullButton}
        />
        {checking && (
          <ActivityIndicator
            style={styles.spinner}
            color={Colors.mute}
            size="small"
          />
        )}
      </View>
    </View>
  );
};

export default ApplicationProcessingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topBar: {
    paddingTop: vscale(45),
    paddingHorizontal: hscale(20),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(12),
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  logoutText: {
    fontSize: fscale(12.5),
    fontWeight: '700',
    color: Colors.red,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hscale(32),
  },
  iconRing: {
    width: hscale(72),
    height: hscale(72),
    borderRadius: hscale(36),
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vscale(24),
  },
  title: {
    fontSize: fscale(24),
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Colors.ink,
    textAlign: 'center',
  },
  message: {
    marginTop: vscale(12),
    fontSize: fscale(14),
    lineHeight: fscale(21),
    color: Colors.mute,
    textAlign: 'center',
  },
  note: {
    marginTop: vscale(18),
    fontSize: fscale(12.5),
    fontWeight: '600',
    color: Colors.amber,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(44),
    paddingTop: vscale(16),
  },
  fullButton: { width: '100%' },
  spinner: { marginTop: vscale(10) },
});
