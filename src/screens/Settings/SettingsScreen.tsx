import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Row from '../../components/common/Row';
import HeaderBack from '../../components/common/HeaderBack';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import LanguageSheet from '../../components/settings/LanguageSheet';
import UserIcon from '../../assets/icons/UserIcon';
import PhoneIcon from '../../assets/icons/PhoneIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import CarIcon from '../../assets/icons/CarIcon';
import IntercityIcon from '../../assets/icons/IntercityIcon';
import LocateIcon from '../../assets/icons/LocateIcon';
import SettingsIcon from '../../assets/icons/SettingsIcon';
import InvoiceIcon from '../../assets/icons/InvoiceIcon';
import TrashIcon from '../../assets/icons/TrashIcon';
import { PARTNER_PROFILE } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';
import { getLanguageOption } from '../../i18n/languages';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// labelKey points at settings.preferences.<key> in the locale files.
const DEFAULT_PREFERENCES = [
  { key: 'push', labelKey: 'settings.preferences.push', value: true },
  {
    key: 'rideRequests',
    labelKey: 'settings.preferences.rideRequests',
    value: true,
  },
  {
    key: 'payoutAlerts',
    labelKey: 'settings.preferences.payoutAlerts',
    value: true,
  },
  {
    key: 'bgLocation',
    labelKey: 'settings.preferences.bgLocation',
    value: true,
  },
  { key: 'sound', labelKey: 'settings.preferences.sound', value: true },
  {
    key: 'showEarnings',
    labelKey: 'settings.preferences.showEarnings',
    value: false,
  },
];

const APP_VERSION = '1.0.0';
const APP_BUILD = '1001';

const SettingsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t, i18n } = useTranslation();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);

  const togglePreference = (key: string) => {
    setPreferences(prev =>
      prev.map(p => (p.key === key ? { ...p, value: !p.value } : p)),
    );
  };

  // TODO: policy/legal links and delete-account confirmation aren't wired yet.
  const noop = () => console.log('TODO: wire this up');

  const activeLanguage = getLanguageOption(i18n.language);

  return (
    <View style={styles.container}>
      <HeaderBack
        title={t('settings.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>
          {t('settings.sections.profile')}
        </Text>
        <Card pad={4}>
          <Row
            icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('settings.rows.personalInfo.title')}
            sub={t('settings.rows.personalInfo.sub')}
            showDivider
          />
          <Row
            icon={<PhoneIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('settings.rows.mobile.title')}
            sub={t('settings.rows.mobile.sub', {
              phone: PARTNER_PROFILE.phone,
            })}
            showDivider
          />
          <Row
            icon={<ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('settings.rows.kyc.title')}
            sub={t('settings.rows.kyc.sub')}
          />
        </Card>

        <Text style={styles.sectionLabel}>
          {t('settings.sections.preferences')}
        </Text>
        <Card pad={4}>
          {preferences.map((pref, i) => (
            <View
              key={pref.key}
              style={[styles.prefRow, i > 0 && styles.prefRowBorder]}
            >
              <Text style={styles.prefLabel}>{t(pref.labelKey)}</Text>
              <ToggleSwitch
                value={pref.value}
                onChange={() => togglePreference(pref.key)}
              />
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>
          {t('settings.sections.service')}
        </Text>
        <Card pad={4}>
          <Row
            icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('settings.rows.vehicleType.title')}
            sub={t('settings.rows.vehicleType.sub')}
            showDivider
          />
          <Row
            icon={
              <IntercityIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title={t('settings.rows.intercity.title')}
            sub={t('settings.rows.intercity.sub')}
            showDivider
          />
          <Row
            icon={<LocateIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('settings.rows.serviceArea.title')}
            sub={t('settings.rows.serviceArea.sub')}
            showDivider
          />
          <Row
            icon={
              <SettingsIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title={t('settings.rows.language.title')}
            sub={activeLanguage.nativeLabel}
            onPress={() => setLanguageSheetVisible(true)}
          />
        </Card>

        <Text style={styles.sectionLabel}>{t('settings.sections.legal')}</Text>
        <Card pad={4}>
          <Row
            icon={<ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('settings.rows.privacyPolicy.title')}
            onPress={noop}
            showDivider
          />
          <Row
            icon={
              <InvoiceIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title={t('settings.rows.partnerAgreement.title')}
            onPress={noop}
            showDivider
          />
          <Row
            icon={<TrashIcon size={18} color={Colors.red} strokeWidth={1.8} />}
            title={t('settings.rows.deleteAccount.title')}
            danger
            onPress={noop}
          />
        </Card>

        <Text style={styles.footerText}>
          {t('settings.footer', { version: APP_VERSION, build: APP_BUILD })}
        </Text>
      </ScrollView>

      <LanguageSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
      />
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(4),
    paddingBottom: vscale(30),
  },
  sectionLabel: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: vscale(16),
    marginBottom: vscale(8),
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: hscale(12),
    paddingHorizontal: hscale(8),
  },
  prefRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line2,
  },
  prefLabel: {
    fontSize: fscale(13.5),
    fontWeight: '500',
    color: Colors.ink,
  },
  footerText: {
    marginTop: vscale(16),
    textAlign: 'center',
    fontSize: fscale(11),
    color: Colors.mute2,
  },
});
