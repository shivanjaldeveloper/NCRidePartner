import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import HeaderBack from '../../components/common/HeaderBack';
import Row from '../../components/common/Row';
import LiveRouteMap from '../../components/common/LiveRouteMap';
import LinkIcon from '../../assets/icons/LinkIcon';
import RouteIcon from '../../assets/icons/RouteIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import CarIcon from '../../assets/icons/CarIcon';
import UserIcon from '../../assets/icons/UserIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import { RootStackParamList } from '../../navigation/types';
import { getCookie } from '../../utils/session';
import {
  getRideDetail,
  GetRideDetailResponse,
} from '../../services/api/ridesService';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
type RouteProps = RouteProp<RootStackParamList, 'TripDetail'>;

const isCompletedStatus = (status: string) =>
  status?.toUpperCase() === 'COMPLETED';

const TripDetailScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  // tripId here is the ride's RideTran — GetRideDetail is keyed by that,
  // not RideId. createdDate/createdTime come from the GetRideHistory row
  // since GetRideDetail's response doesn't return them.
  const { tripId, createdDate, createdTime } = useRoute<RouteProps>().params;

  const [detail, setDetail] = useState<GetRideDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cookie = await getCookie();
      if (!cookie) {
        setError(t('tripDetail.errors.sessionNotFound'));
        return;
      }
      const res = await getRideDetail(cookie, tripId);
      if (res.Result !== 'Success') {
        setError(res.Message || t('tripDetail.errors.loadFailed'));
        return;
      }
      setDetail(res);
    } catch (err: any) {
      setError(err?.message || t('tripDetail.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tripId, t]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const isCompleted = detail ? isCompletedStatus(detail.Status) : false;
  const fare = detail ? Number(detail.EstimatedFare) || 0 : 0;
  const gross = Math.round(fare * 1.1);
  const platformFee = Math.round(fare * 0.08);
  const tds = Math.round(fare * 0.01);
  const dateTimeSub =
    createdDate || createdTime
      ? `${createdDate ?? ''}${createdDate && createdTime ? ' · ' : ''}${
          createdTime ?? ''
        }`
      : undefined;

  return (
    <View style={styles.container}>
      <HeaderBack
        title={t('tripDetail.headerTitle')}
        sub={tripId}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity style={styles.shareButton}>
            <LinkIcon size={18} color={Colors.ink} strokeWidth={1.8} />
          </TouchableOpacity>
        }
      />

      {loading && (
        <View style={styles.stateBox}>
          <ActivityIndicator color={Colors.ink} size="small" />
          <Text style={styles.stateText}>{t('tripDetail.loading')}</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.85}
            onPress={loadDetail}
          >
            <Text style={styles.retryButtonText}>{t('tripDetail.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && detail && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mapWrap}>
            <LiveRouteMap
              destination={{
                latitude: parseFloat(detail.Drop.Latitude),
                longitude: parseFloat(detail.Drop.Longitude),
              }}
              destinationColor={Colors.ink}
              encodedPolyline={detail.Route?.EncodedPolyline}
              polylineColor={detail.Route?.PolylineColor || Colors.blue}
              // This is a completed/past ride — there's no "partner's
              // current position" to draw a Google Directions fallback
              // route from, so skip it and just rely on the real
              // EncodedPolyline.
              fallbackRoute={false}
              // Nothing to "navigate" on a past trip — don't watch live
              // position or drive the follow-camera here.
              liveNavigation={false}
            />
          </View>

          <Card style={styles.earningCard} pad={16}>
            <View style={styles.earningRow}>
              <View>
                <Text style={styles.sectionLabel}>
                  {t('tripDetail.earning')}
                </Text>
                <Text style={styles.earningAmount}>
                  {detail.EstimatedFareText}
                </Text>
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
                    {isCompleted
                      ? t('trips.status.completed')
                      : t('trips.status.cancelled')}
                  </Text>
                </View>
                <Text style={styles.earningDist}>
                  {detail.Route.DistanceKM} km
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.infoCard} pad={4}>
            <Text style={styles.groupLabel}>{t('tripDetail.tripInfo')}</Text>
            <Row
              icon={
                <RouteIcon size={18} color={Colors.ink} strokeWidth={1.8} />
              }
              title={t('tripDetail.fields.route')}
              sub={`${detail.Pickup.Address} → ${detail.Drop.Address}`}
              showChevron={false}
              showDivider
            />
            {dateTimeSub && (
              <Row
                icon={
                  <ClockIcon size={18} color={Colors.ink} strokeWidth={1.8} />
                }
                title={t('tripDetail.fields.dateTime')}
                sub={dateTimeSub}
                showChevron={false}
                showDivider
              />
            )}
            <Row
              icon={<CarIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('tripDetail.fields.vehicle')}
              sub={detail.VehicleType}
              showChevron={false}
              showDivider
            />
            <Row
              icon={<UserIcon size={18} color={Colors.ink} strokeWidth={1.8} />}
              title={t('tripDetail.fields.customer')}
              sub={`${detail.Customer.Name} · ${detail.Customer.Mobile}`}
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
                <Text style={styles.breakdownTotalValue}>
                  {detail.EstimatedFareText}
                </Text>
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
      )}
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
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vscale(10),
  },
  stateText: {
    fontSize: fscale(12.5),
    color: Colors.mute,
  },
  errorText: {
    fontSize: fscale(13),
    color: Colors.mute,
    textAlign: 'center',
    paddingHorizontal: hscale(24),
  },
  retryButton: {
    marginTop: vscale(4),
    paddingVertical: vscale(9),
    paddingHorizontal: hscale(20),
    borderRadius: hscale(12),
    backgroundColor: Colors.ink,
  },
  retryButtonText: {
    fontSize: fscale(13),
    fontWeight: '700',
    color: '#FFFFFF',
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
