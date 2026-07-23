import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import HeaderBack from '../../components/common/HeaderBack';
import Row from '../../components/common/Row';
import RouteMapIllustration from '../../components/common/RouteMapIllustration';
import LinkIcon from '../../assets/icons/LinkIcon';
import RouteIcon from '../../assets/icons/RouteIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import CarIcon from '../../assets/icons/CarIcon';
import UserIcon from '../../assets/icons/UserIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import { PARTNER_TRIPS, tripStatusKey } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
type RouteProps = RouteProp<RootStackParamList, 'TripDetail'>;

const TripDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const { tripId } = useRoute<RouteProps>().params;

  const trip = PARTNER_TRIPS.find(t => t.id === tripId) || PARTNER_TRIPS[0];
  const isCompleted = trip.status === 'Completed';
  const gross = Math.round(trip.earning * 1.1);
  const platformFee = Math.round(trip.earning * 0.08);
  const tds = Math.round(trip.earning * 0.01);

  return (
    <View style={styles.container}>
      <HeaderBack
        title={t('tripDetail.headerTitle')}
        sub={trip.id}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity style={styles.shareButton}>
            <LinkIcon size={18} color={Colors.ink} strokeWidth={1.8} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapWrap}>
          <RouteMapIllustration />
        </View>

        <Card style={styles.earningCard} pad={16}>
          <View style={styles.earningRow}>
            <View>
              <Text style={styles.sectionLabel}>{t('tripDetail.earning')}</Text>
              <Text style={styles.earningAmount}>₹{trip.earning}</Text>
            </View>
            <View style={styles.earningRight}>
              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isCompleted
                      ? '#E9F8E4'
                      : 'rgba(224,82,78,0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: isCompleted ? Colors.green : Colors.red },
                  ]}
                >
                  {t(tripStatusKey(trip.status))}
                </Text>
              </View>
              <Text style={styles.earningDist}>{trip.dist}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard} pad={4}>
          <Text style={styles.groupLabel}>{t('tripDetail.tripInfo')}</Text>
          <Row
            icon={<RouteIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('tripDetail.fields.route')}
            sub={`${trip.from} → ${trip.to}`}
            showChevron={false}
            showDivider
          />
          <Row
            icon={<ClockIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('tripDetail.fields.dateTime')}
            sub={trip.date}
            showChevron={false}
            showDivider
          />
          <Row
            icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('tripDetail.fields.vehicle')}
            sub={t('tripDetail.vehicleSub')}
            showChevron={false}
            showDivider
          />
          <Row
            icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('tripDetail.fields.passengerRating')}
            sub={t('tripDetail.passengerRatingSub')}
            showChevron={false}
          />
        </Card>

        {isCompleted && (
          <Card style={styles.breakdownCard} pad={16}>
            <Text style={styles.groupLabel}>
              {t('tripDetail.earningsDetail')}
            </Text>
            {[
              [t('tripDetail.grossEarning'), `₹${gross}`],
              [t('tripDetail.platformFee'), `−₹${platformFee}`],
              [t('tripDetail.tds'), `−₹${tds}`],
            ].map(([k, v]) => (
              <View key={k} style={styles.breakdownRow}>
                <Text style={styles.breakdownKey}>{k}</Text>
                <Text style={styles.breakdownValue}>{v}</Text>
              </View>
            ))}
            <View style={styles.breakdownTotal}>
              <Text style={styles.breakdownTotalLabel}>
                {t('tripDetail.netEarning')}
              </Text>
              <Text style={styles.breakdownTotalValue}>₹{trip.earning}</Text>
            </View>
          </Card>
        )}

        <Card style={styles.reportCard} pad={4}>
          <Row
            icon={<ChatIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
            title={t('tripDetail.reportIssue')}
            sub={t('tripDetail.reportIssueSub')}
            onPress={() => console.log('TODO: navigate to Support')}
          />
        </Card>
      </ScrollView>
    </View>
  );
};

export default TripDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  shareButton: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(14),
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(4),
    paddingBottom: vscale(30),
  },
  mapWrap: {
    height: vscale(140),
    borderRadius: hscale(18),
    overflow: 'hidden',
  },
  earningCard: {
    marginTop: vscale(12),
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  earningAmount: {
    fontSize: fscale(30),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.8,
    marginTop: vscale(2),
  },
  earningRight: {
    alignItems: 'flex-end',
  },
  statusChip: {
    paddingVertical: vscale(5),
    paddingHorizontal: hscale(10),
    borderRadius: hscale(8),
  },
  statusText: {
    fontSize: fscale(11.5),
    fontWeight: '700',
  },
  earningDist: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(6),
  },
  infoCard: {
    marginTop: vscale(12),
  },
  groupLabel: {
    padding: hscale(12),
    paddingBottom: vscale(4),
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  breakdownCard: {
    marginTop: vscale(12),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vscale(6),
  },
  breakdownKey: {
    fontSize: fscale(13.5),
    color: Colors.ink2,
  },
  breakdownValue: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink2,
  },
  breakdownTotal: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
    marginTop: vscale(8),
    paddingTop: vscale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownTotalLabel: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  breakdownTotalValue: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: Colors.green,
  },
  reportCard: {
    marginTop: vscale(12),
  },
});
