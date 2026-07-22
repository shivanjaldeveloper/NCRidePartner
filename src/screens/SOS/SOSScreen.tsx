import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Row from '../../components/common/Row';
import HeaderBack from '../../components/common/HeaderBack';
import SosIcon from '../../assets/icons/SosIcon';
import PhoneIcon from '../../assets/icons/PhoneIcon';
import UserIcon from '../../assets/icons/UserIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import CarIcon from '../../assets/icons/CarIcon';
import PlusIcon from '../../assets/icons/PlusIcon';
import { PARTNER_EMERGENCY_CONTACTS } from './mockSosData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HOLD_DURATION_MS = 3000;

const SOSScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const [holding, setHolding] = useState(false);
  const [alerted, setAlerted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    setHolding(true);
    timerRef.current = setTimeout(() => {
      setHolding(false);
      setAlerted(true);
      setTimeout(() => setAlerted(false), 4000);
    }, HOLD_DURATION_MS);
  };

  const cancelHold = () => {
    setHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // TODO: real emergency dispatch / call integrations aren't wired yet.
  const noop = () => console.log('TODO: wire this up');

  return (
    <View style={styles.container}>
      <HeaderBack
        title={t('sos.headerTitle')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.sosCard} pad={20}>
          <View style={styles.sosTopRow}>
            <View style={styles.sosIconWrap}>
              <SosIcon size={26} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.sosTextWrap}>
              <Text style={styles.sosTitle}>Tap & Hold for SOS</Text>
              <Text style={styles.sosSub}>
                Live location sent to police + emergency contacts
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={startHold}
            onPressOut={cancelHold}
            style={[styles.holdButton, holding && styles.holdButtonActive]}
          >
            <Text style={styles.holdButtonLabel}>
              {alerted ? t('sos.alertSent') : t('sos.holdToAlert')}
            </Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.groupCard} pad={4}>
          <Text style={styles.sectionLabel}>{t('sos.emergencyContacts')}</Text>
          {PARTNER_EMERGENCY_CONTACTS.map((c, i) => (
            <Row
              key={c.title}
              icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={c.title}
              sub={c.sub}
              showDivider={i < PARTNER_EMERGENCY_CONTACTS.length - 1}
              right={
                <PhoneIcon size={18} color={Colors.green} strokeWidth={1.8} />
              }
            />
          ))}
          <TouchableOpacity style={styles.addContactButton} onPress={noop}>
            <PlusIcon size={15} color={Colors.ink} strokeWidth={2} />
            <Text style={styles.addContactLabel}>{t('sos.addContact')}</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.groupCard} pad={4}>
          <Text style={styles.sectionLabel}>{t('sos.partnerSafety')}</Text>
          <Row
            icon={<ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('sos.reportUnsafe.title')}
            sub={t('sos.reportUnsafe.sub')}
            onPress={noop}
            showDivider
          />
          <Row
            icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('sos.accidentSupport.title')}
            sub={t('sos.accidentSupport.sub')}
            onPress={noop}
            showDivider
          />
          <Row
            icon={<PhoneIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('sos.callSupport.title')}
            sub={t('sos.callSupport.sub')}
            onPress={noop}
          />
        </Card>
      </ScrollView>
    </View>
  );
};

export default SOSScreen;

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
  sosCard: {
    backgroundColor: Colors.red,
    borderColor: 'transparent',
  },
  sosTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  sosIconWrap: {
    width: hscale(56),
    height: hscale(56),
    borderRadius: hscale(28),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    fontSize: fscale(19),
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  sosSub: {
    fontSize: fscale(12),
    color: 'rgba(255,255,255,0.85)',
    marginTop: vscale(2),
  },
  holdButton: {
    marginTop: vscale(16),
    width: '100%',
    height: hscale(56),
    borderRadius: hscale(16),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  holdButtonLabel: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  groupCard: {
    marginTop: vscale(14),
  },
  sectionLabel: {
    padding: hscale(12),
    paddingBottom: vscale(4),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  addContactButton: {
    margin: hscale(8),
    marginTop: vscale(2),
    height: hscale(40),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
  },
  addContactLabel: {
    fontSize: fscale(12.5),
    fontWeight: '700',
    color: Colors.ink,
  },
});
