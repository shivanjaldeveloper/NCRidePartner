import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale, safeLineHeight } from '../../theme/scale';
import PrimaryButton from '../../components/common/PrimaryButton';
import PermissionMapIllustration from '../../components/permissions/illustrations/PermissionMapIllustration';
import PulsingLocationPin from '../../components/permissions/PulsingLocationPin';
import LocateIcon from '../../assets/icons/LocateIcon';
import BellIcon from '../../assets/icons/BellIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Permissions'>;

// Translation keys instead of static text; icon stays static since it's
// purely visual and unrelated to language.
const PERMISSION_ITEMS: {
  icon: 'locate' | 'bell' | 'shield';
  titleKey: string;
  subKey: string;
}[] = [
  {
    icon: 'locate',
    titleKey: 'permissions.items.location.title',
    subKey: 'permissions.items.location.sub',
  },
  {
    icon: 'bell',
    titleKey: 'permissions.items.notifications.title',
    subKey: 'permissions.items.notifications.sub',
  },
  {
    icon: 'shield',
    titleKey: 'permissions.items.background.title',
    subKey: 'permissions.items.background.sub',
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
  const { t } = useTranslation();

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
          <Text style={styles.title}>{t('permissions.title')}</Text>
          <Text style={styles.subtitle}>{t('permissions.subtitle')}</Text>

          <View style={styles.list}>
            {PERMISSION_ITEMS.map(item => (
              <View key={item.titleKey} style={styles.listRow}>
                <View style={styles.iconWrap}>
                  <PermissionIcon name={item.icon} />
                </View>
                <View style={styles.listTextWrap}>
                  <Text style={styles.listTitle}>{t(item.titleKey)}</Text>
                  <Text style={styles.listSub}>{t(item.subKey)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={t('permissions.allowAll')}
          onPress={handleContinue}
          icon="none"
          style={styles.fullButton}
        />
        <PrimaryButton
          label={t('permissions.notNow')}
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
    lineHeight: safeLineHeight(fscale(28)),
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
