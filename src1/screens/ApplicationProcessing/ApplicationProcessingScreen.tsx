import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import PrimaryButton from '../../components/common/PrimaryButton';
import ClockIcon from '../../assets/icons/ClockIcon';
import { RootStackParamList } from '../../navigation/types';
// import { getCookie, clearCookie } from '../../utils/session';
// import { verifyCookie } from '../../services/api/authService';
// import { resolveProcessingStatus } from '../../services/api/partnerStatus';

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  'ApplicationProcessing'
>;

const ApplicationProcessingScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    if (checking) return;
    setChecking(true);
    setNote(null);
    try {
      // TEMP: bypass status API until backend is ready
      await new Promise(resolve => setTimeout(resolve, 600));
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } finally {
      setChecking(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconRing}>
          <ClockIcon size={30} color={Colors.ink} strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>Application processing</Text>
        <Text style={styles.message}>
          Your documents have been submitted successfully and are under
          verification.{'\n\n'}
          We will notify you once your account has been approved.
        </Text>

        {note && <Text style={styles.note}>{note}</Text>}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={checking ? 'Checking…' : 'Check status'}
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
