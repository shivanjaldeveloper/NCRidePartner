import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Row from '../../components/common/Row';
import HeaderBack from '../../components/common/HeaderBack';
import ToggleSwitch from '../../components/common/ToggleSwitch';
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

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_PREFERENCES = [
  { key: 'push', label: 'Push notifications', value: true },
  { key: 'rideRequests', label: 'New ride requests', value: true },
  { key: 'payoutAlerts', label: 'Earnings & payout alerts', value: true },
  { key: 'bgLocation', label: 'Background location', value: true },
  { key: 'sound', label: 'Sound for ride requests', value: true },
  { key: 'showEarnings', label: 'Show earnings on home', value: false },
];

const SettingsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const togglePreference = (key: string) => {
    setPreferences(prev =>
      prev.map(p => (p.key === key ? { ...p, value: !p.value } : p)),
    );
  };

  // TODO: policy/legal links and delete-account confirmation aren't wired yet.
  const noop = () => console.log('TODO: wire this up');

  return (
    <View style={styles.container}>
      <HeaderBack title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Partner profile</Text>
        <Card pad={4}>
          <Row
            icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title="Personal info"
            sub="Name, photo, address"
            showDivider
          />
          <Row
            icon={<PhoneIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title="Mobile"
            sub={`${PARTNER_PROFILE.phone} · Verified`}
            showDivider
          />
          <Row
            icon={<ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title="KYC verification"
            sub="Aadhaar · PAN · DL verified"
          />
        </Card>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <Card pad={4}>
          {preferences.map((pref, i) => (
            <View
              key={pref.key}
              style={[styles.prefRow, i > 0 && styles.prefRowBorder]}
            >
              <Text style={styles.prefLabel}>{pref.label}</Text>
              <ToggleSwitch
                value={pref.value}
                onChange={() => togglePreference(pref.key)}
              />
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>Service preferences</Text>
        <Card pad={4}>
          <Row
            icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title="Vehicle type"
            sub="Sedan · Car service"
            showDivider
          />
          <Row
            icon={
              <IntercityIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title="Intercity trips"
            sub="Enabled · NCR outstation"
            showDivider
          />
          <Row
            icon={<LocateIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title="Service area"
            sub="Noida · Delhi · Gurugram"
            showDivider
          />
          <Row
            icon={
              <SettingsIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title="Language"
            sub="Hindi / English"
          />
        </Card>

        <Text style={styles.sectionLabel}>Privacy & legal</Text>
        <Card pad={4}>
          <Row
            icon={<ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title="Privacy policy"
            onPress={noop}
            showDivider
          />
          <Row
            icon={
              <InvoiceIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title="Partner agreement"
            onPress={noop}
            showDivider
          />
          <Row
            icon={<TrashIcon size={18} color={Colors.red} strokeWidth={1.8} />}
            title="Delete account"
            danger
            onPress={noop}
          />
        </Card>

        <Text style={styles.footerText}>
          Alo Alo Partner · v 1.0.0 (build 1001) · Marathwada, India
        </Text>
      </ScrollView>
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
