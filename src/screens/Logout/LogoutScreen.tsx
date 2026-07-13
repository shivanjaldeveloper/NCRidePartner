import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import PrimaryButton from '../../components/common/PrimaryButton';
import LogoutIcon from '../../assets/icons/LogoutIcon';
import { clearCookie } from '../../utils/session';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const LogoutScreen = () => {
  const navigation = useNavigation<NavProp>();

  const dismiss = () => navigation.goBack();

  const handleLogout = async () => {
    await clearCookie();
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  };

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={styles.scrim} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <LogoutIcon size={32} color={Colors.red} strokeWidth={1.8} />
          </View>
          <Text style={styles.title}>Log out of Alo Alo Partner?</Text>
          <Text style={styles.subtitle}>
            You can sign back in anytime. Your earnings, documents and vehicle
            info stay safe.
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton
            label="Stay logged in"
            onPress={dismiss}
            icon="none"
            variant="ghost"
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Log out"
            onPress={handleLogout}
            icon="none"
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
};

export default LogoutScreen;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,17,21,0.5)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: hscale(32),
    borderTopRightRadius: hscale(32),
    paddingBottom: vscale(36),
  },
  handle: {
    alignSelf: 'center',
    width: hscale(38),
    height: vscale(4),
    borderRadius: 2,
    backgroundColor: Colors.line,
    marginTop: vscale(12),
    marginBottom: vscale(18),
  },
  content: {
    paddingHorizontal: hscale(24),
    alignItems: 'center',
  },
  iconCircle: {
    width: hscale(70),
    height: hscale(70),
    borderRadius: hscale(35),
    backgroundColor: '#FCE6E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: vscale(14),
    fontSize: fscale(22),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: vscale(6),
    fontSize: fscale(13.5),
    color: Colors.mute,
    lineHeight: fscale(20),
    textAlign: 'center',
  },
  actionsRow: {
    marginTop: vscale(20),
    paddingHorizontal: hscale(18),
    flexDirection: 'row',
    gap: hscale(8),
  },
  actionButton: {
    flex: 1,
  },
});
