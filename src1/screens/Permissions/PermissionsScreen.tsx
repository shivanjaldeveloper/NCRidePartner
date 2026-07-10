import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import PrimaryButton from '../../components/common/PrimaryButton';
import PermissionMapIllustration from '../../components/permissions/illustrations/PermissionMapIllustration';
import PulsingLocationPin from '../../components/permissions/PulsingLocationPin';
import LocateIcon from '../../assets/icons/LocateIcon';
import BellIcon from '../../assets/icons/BellIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Permissions'>;

const PERMISSION_ITEMS: {
  icon: 'locate' | 'bell' | 'shield';
  title: string;
  sub: string;
}[] = [
  {
    icon: 'locate',
    title: 'Precise location',
    sub: 'For accurate pickup & navigation',
  },
  {
    icon: 'bell',
    title: 'Notifications',
    sub: 'New ride requests & alerts',
  },
  {
    icon: 'shield',
    title: 'Background location',
    sub: 'Required when app is minimised',
  },
];

const PermissionIcon = ({ name }: { name: 'locate' | 'bell' | 'shield' }) => {
  if (name === 'locate')
    return <LocateIcon size={18} color={Colors.ink} strokeWidth={1.8} />;
  if (name === 'bell')
    return <BellIcon size={18} color={Colors.ink} strokeWidth={1.8} />;
  return <ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />;
};

const PermissionsScreen = () => {
  const navigation = useNavigation<NavProp>();

  const handleContinue = () => navigation.navigate('Verification');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mapCard}>
          <PermissionMapIllustration />
          <View style={styles.pinOverlay}>
            <PulsingLocationPin />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Allow location access</Text>
          <Text style={styles.subtitle}>
            NCRide Partner uses your location for ride matching, navigation, and
            trip tracking. Required to go online.
          </Text>

          <View style={styles.list}>
            {PERMISSION_ITEMS.map(item => (
              <View key={item.title} style={styles.listRow}>
                <View style={styles.iconWrap}>
                  <PermissionIcon name={item.icon} />
                </View>
                <View style={styles.listTextWrap}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listSub}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Allow all permissions"
          onPress={handleContinue}
          icon="none"
          style={styles.fullButton}
        />
        <PrimaryButton
          label="Not now"
          onPress={handleContinue}
          icon="none"
          variant="ghost"
          style={styles.fullButton}
        />
      </View>
    </View>
  );
};

export default PermissionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingTop: vscale(90),
    paddingHorizontal: hscale(28),
  },
  mapCard: {
    width: '100%',
    height: vscale(220),
    borderRadius: hscale(26),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.map,
  },
  pinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    marginTop: vscale(28),
  },
  title: {
    fontSize: fscale(28),
    fontWeight: '700',
    letterSpacing: -0.8,
    color: Colors.ink,
    lineHeight: fscale(32),
  },
  subtitle: {
    marginTop: vscale(10),
    fontSize: fscale(14),
    color: Colors.mute,
    lineHeight: fscale(21),
  },
  list: {
    marginTop: vscale(18),
    gap: vscale(10),
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  iconWrap: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(200,242,96,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTextWrap: {
    flex: 1,
  },
  listTitle: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  listSub: {
    fontSize: fscale(12),
    color: Colors.mute,
    marginTop: vscale(1),
  },
  footer: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(100),
    paddingTop: vscale(12),
    gap: vscale(10),
  },
  fullButton: {
    width: '100%',
  },
});
