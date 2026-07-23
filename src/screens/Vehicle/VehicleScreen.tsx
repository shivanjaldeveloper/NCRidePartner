import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Row from '../../components/common/Row';
import HeaderBack from '../../components/common/HeaderBack';
import CarIcon from '../../assets/icons/CarIcon';
import TaxiIcon from '../../assets/icons/TaxiIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import InvoiceIcon from '../../assets/icons/InvoiceIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import EditIcon from '../../assets/icons/EditIcon';
import { PARTNER_VEHICLES } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SERVICE_AREA_KEYS = [
  'vehicle.serviceAreas.noida',
  'vehicle.serviceAreas.delhiNcr',
  'vehicle.serviceAreas.gurugram',
  'vehicle.serviceAreas.greaterNoida',
];

const VehicleScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const v = PARTNER_VEHICLES[0];

  return (
    <View style={styles.container}>
      <HeaderBack
        title={t('vehicle.headerTitle')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card pad={0} style={styles.vehicleCard}>
          <View style={styles.vehicleCardGlow} />
          <View style={styles.vehicleCardInner}>
            <Text style={styles.eyebrow}>{t('vehicle.activeVehicle')}</Text>
            <Text style={styles.plateNumber}>{v.number}</Text>
            <Text style={styles.vehicleMeta}>
              {v.model} · {v.color} · {v.year}
            </Text>

            <View style={styles.carIllustrationWrap}>
              <Svg width={180} height={60} viewBox="0 0 240 80">
                <Path
                  d="M20 60 L30 25 H150 L160 60 V64 H20Z"
                  fill="rgba(255,255,255,0.12)"
                />
                <Rect
                  x={34}
                  y={28}
                  width={110}
                  height={28}
                  rx={4}
                  fill="rgba(154,200,255,0.35)"
                />
                <Circle
                  cx={46}
                  cy={64}
                  r={10}
                  fill="rgba(255,255,255,0.2)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={2}
                />
                <Circle
                  cx={134}
                  cy={64}
                  r={10}
                  fill="rgba(255,255,255,0.2)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={2}
                />
              </Svg>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard} pad={4}>
          <Text style={styles.sectionLabel}>{t('vehicle.vehicleInfo')}</Text>
          <Row
            icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('vehicle.fields.type')}
            sub={v.type}
            showChevron={false}
            showDivider
          />
          <Row
            icon={<TaxiIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('vehicle.fields.serviceCategory')}
            sub={v.service}
            showChevron={false}
            showDivider
          />
          <Row
            icon={<ShieldIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('vehicle.fields.rcStatus')}
            sub={v.status}
            showChevron={false}
            showDivider
          />
          <Row
            icon={
              <InvoiceIcon size={18} color={Colors.ink} strokeWidth={1.8} />
            }
            title={t('vehicle.fields.insurance')}
            sub={t('vehicle.validTillMar2027')}
            showChevron={false}
            showDivider
          />
          <Row
            icon={<CheckIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('vehicle.fields.puc')}
            sub={t('vehicle.validTillSep2026')}
            showChevron={false}
          />
        </Card>

        <Card style={styles.areasCard} pad={14}>
          <Text style={styles.sectionLabel}>
            {t('vehicle.serviceAreasLabel')}
          </Text>
          {SERVICE_AREA_KEYS.map((areaKey, i) => (
            <View
              key={areaKey}
              style={[styles.areaRow, i > 0 && styles.areaRowBorder]}
            >
              <View style={styles.areaDot} />
              <Text style={styles.areaText}>{t(areaKey)}</Text>
            </View>
          ))}
        </Card>

        <TouchableOpacity style={styles.updateButton} activeOpacity={0.8}>
          <EditIcon size={17} color={Colors.ink} strokeWidth={1.8} />
          <Text style={styles.updateButtonLabel}>
            {t('vehicle.updateVehicleDetails')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default VehicleScreen;

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
  vehicleCard: {
    backgroundColor: '#0F1115',
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  vehicleCardGlow: {
    position: 'absolute',
    top: hscale(-20),
    right: hscale(-20),
    width: hscale(140),
    height: hscale(140),
    borderRadius: hscale(70),
    backgroundColor: 'rgba(200,242,96,0.12)',
  },
  vehicleCardInner: {
    padding: hscale(20),
  },
  eyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  plateNumber: {
    fontSize: fscale(26),
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginTop: vscale(6),
    color: Colors.lime,
  },
  vehicleMeta: {
    fontSize: fscale(14),
    color: 'rgba(255,255,255,0.7)',
    marginTop: vscale(4),
  },
  carIllustrationWrap: {
    marginTop: vscale(12),
  },
  infoCard: {
    marginTop: vscale(12),
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
  areasCard: {
    marginTop: vscale(12),
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    paddingVertical: vscale(8),
  },
  areaRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line2,
  },
  areaDot: {
    width: hscale(7),
    height: hscale(7),
    borderRadius: hscale(4),
    backgroundColor: Colors.green,
  },
  areaText: {
    fontSize: fscale(13.5),
    fontWeight: '500',
    color: Colors.ink,
  },
  updateButton: {
    marginTop: vscale(12),
    height: hscale(52),
    borderRadius: hscale(16),
    borderWidth: 0.5,
    borderColor: Colors.line,
    backgroundColor: 'rgba(255,255,255,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
  },
  updateButtonLabel: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
});
