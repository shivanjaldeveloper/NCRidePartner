import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale, safeLineHeight } from '../../theme/scale';
import LocateIcon from '../../assets/icons/LocateIcon';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
}

/**
 * Centered, app-themed replacement for Alert.alert — used for the
 * location permission/settings prompts so they match the rest of the app
 * (ink/lime palette, same rounded-card Modal treatment as PaymentScreen's
 * processing/success popup) instead of the native OS alert style.
 */
const LocationStatusModal: React.FC<Props> = ({
  visible,
  title,
  message,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onSecondaryPress || onPrimaryPress}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <LocateIcon size={22} color={Colors.ink} strokeWidth={1.8} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.88}
            onPress={onPrimaryPress}
          >
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>

          {!!secondaryLabel && (
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={onSecondaryPress}
            >
              <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default LocationStatusModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,17,21,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hscale(32),
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: hscale(22),
    paddingVertical: vscale(26),
    paddingHorizontal: hscale(22),
    alignItems: 'center',
  },
  iconWrap: {
    width: hscale(52),
    height: hscale(52),
    borderRadius: hscale(26),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vscale(14),
  },
  title: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  message: {
    marginTop: vscale(8),
    fontSize: fscale(13),
    color: Colors.mute,
    textAlign: 'center',
    lineHeight: safeLineHeight(fscale(13)),
  },
  primaryButton: {
    marginTop: vscale(20),
    height: vscale(50),
    width: '100%',
    borderRadius: hscale(14),
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: fscale(14.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    marginTop: vscale(10),
    height: vscale(44),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.mute,
  },
});
