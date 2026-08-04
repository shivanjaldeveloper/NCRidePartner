import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import CashIcon from '../../assets/icons/CashIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import LocateIcon from '../../assets/icons/LocateIcon';
import CarIcon from '../../assets/icons/CarIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import { getCookie } from '../../utils/session';
import { acceptRide } from '../../services/api/ridesService';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'RideRequest'>;
type ScreenRoute = RouteProp<RootStackParamList, 'RideRequest'>;

const TOTAL_SECONDS = 18;
const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatVehicleType(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .split(/[\s_]+/)
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const RideRequestScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { t } = useTranslation();
  const ride = route.params?.ride;
  const [timer, setTimer] = useState(TOTAL_SECONDS);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // No offer to show (e.g. screen opened directly without params) —
  // nothing useful to render, bail back to the tab bar rather than show a
  // broken screen.
  useEffect(() => {
    if (!ride) navigation.navigate('MainTabs');
  }, [ride, navigation]);

  useEffect(() => {
    if (!ride) return;
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigation.navigate('MainTabs');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ride, navigation]);

  if (!ride) return null;

  const pct = timer / TOTAL_SECONDS;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const handleReject = () => navigation.navigate('MainTabs');

  const handleAccept = async () => {
    if (accepting) return;
    setError(null);
    setAccepting(true);
    try {
      const cookie = await getCookie();
      if (!cookie) throw new Error('Session not found. Please log in again.');
      const res = await acceptRide(cookie, ride.RideTran);
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Could not accept this ride.');
      }
      navigation.navigate('PickupNav', { ride });
    } catch (err: any) {
      // Most common real-world case: another partner accepted it first —
      // the offer disappears from GetPendingRides on the next poll, so
      // sending them back to MainTabs (rather than leaving them stuck on
      // a dead offer) is the right recovery.
      setError(
        err?.message ||
          'Could not accept this ride. It may have already been taken.',
      );
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{t('rideRequest.incomingRequest')}</Text>
        <Text style={styles.title}>{t('rideRequest.newTripAvailable')}</Text>
      </View>

      <View style={styles.timerWrap}>
        <Svg width={92} height={92} viewBox="0 0 92 92">
          <Circle
            cx="46"
            cy="46"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <Circle
            cx="46"
            cy="46"
            r={RADIUS}
            fill="none"
            stroke={Colors.lime}
            strokeWidth="6"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 46 46)"
          />
          <SvgText
            x="46"
            y="53"
            textAnchor="middle"
            fontWeight="800"
            fontSize="22"
            fill="#FFFFFF"
          >
            {timer}
          </SvgText>
        </Svg>
      </View>

      <View style={styles.routeSection}>
        <Card style={styles.routeCard} pad={16}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>
                {t('rideRequestSheet.pickupAway', {
                  dist: `${ride.DistanceToPickupKM} km`,
                })}
              </Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {ride.Pickup.Address}
              </Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={styles.dropDot} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>
                {t('rideRequestSheet.dropTrip', {
                  dist: `${ride.TripDistanceKM} km`,
                })}
              </Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {ride.Drop.Address}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <CashIcon size={16} color={Colors.lime} strokeWidth={1.8} />
          <Text style={styles.chipValue}>{ride.EstimatedFareText}</Text>
          <Text style={styles.chipLabel}>
            {t('rideRequestSheet.stats.earning')}
          </Text>
        </View>
        <View style={styles.chip}>
          <ClockIcon size={16} color={Colors.lime} strokeWidth={1.8} />
          <Text style={styles.chipValue}>{ride.TripDurationMinutes} min</Text>
          <Text style={styles.chipLabel}>
            {t('rideRequestSheet.stats.duration')}
          </Text>
        </View>
        <View style={styles.chip}>
          <LocateIcon size={16} color={Colors.lime} strokeWidth={1.8} />
          <Text style={styles.chipValue}>{ride.ETAToPickupMinutes} min</Text>
          <Text style={styles.chipLabel}>
            {t('rideRequestSheet.stats.eta')}
          </Text>
        </View>
      </View>

      <View style={styles.passengerSection}>
        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <CarIcon size={18} color={Colors.lime} strokeWidth={1.8} />
          </View>
          <View style={styles.passengerTextWrap}>
            <Text style={styles.passengerName}>
              {t('rideRequestSheet.vehicle')}
            </Text>
            <Text style={styles.passengerMeta}>
              {formatVehicleType(ride.VehicleType)}
            </Text>
          </View>
        </View>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.spacer} />

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={handleReject}
          style={styles.rejectButton}
          disabled={accepting}
        >
          <CloseIcon size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAccept}
          style={[styles.acceptButton, accepting && styles.acceptButtonBusy]}
          activeOpacity={0.9}
          disabled={accepting}
        >
          {accepting ? (
            <Spinner size={20} color={Colors.ink} />
          ) : (
            <>
              <CheckIcon size={22} color={Colors.ink} strokeWidth={2.4} />
              <Text style={styles.acceptLabel}>
                {t('rideRequestSheet.acceptRide')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RideRequestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  header: {
    paddingTop: vscale(64),
    paddingHorizontal: hscale(24),
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fscale(24),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: vscale(4),
  },
  timerWrap: {
    alignItems: 'center',
    marginTop: vscale(20),
  },
  routeSection: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(16),
  },
  routeCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(8),
  },
  pickupDot: {
    width: hscale(10),
    height: hscale(10),
    borderRadius: hscale(5),
    backgroundColor: Colors.green,
    borderWidth: 3,
    borderColor: 'rgba(31,157,107,0.3)',
  },
  dropDot: {
    width: hscale(10),
    height: hscale(10),
    borderRadius: hscale(2),
    backgroundColor: '#FFFFFF',
  },
  routeConnector: {
    marginLeft: hscale(5),
    width: 0,
    height: vscale(20),
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fscale(10.5),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  routeValue: {
    fontSize: fscale(15),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginTop: vscale(1),
  },
  chipsRow: {
    flexDirection: 'row',
    gap: hscale(8),
    paddingHorizontal: hscale(18),
    paddingTop: vscale(12),
  },
  chip: {
    flex: 1,
    paddingVertical: vscale(10),
    borderRadius: hscale(14),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  chipValue: {
    fontSize: fscale(14),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: vscale(4),
  },
  chipLabel: {
    fontSize: fscale(10.5),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
  passengerSection: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(12),
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    paddingVertical: vscale(10),
    paddingHorizontal: hscale(14),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: hscale(14),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  passengerAvatar: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(18),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerTextWrap: {
    flex: 1,
  },
  passengerName: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  passengerMeta: {
    fontSize: fscale(11.5),
    color: 'rgba(255,255,255,0.5)',
  },
  errorBanner: {
    marginHorizontal: hscale(18),
    marginTop: vscale(12),
    paddingVertical: vscale(10),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(224,82,78,0.14)',
    borderWidth: 0.5,
    borderColor: 'rgba(224,82,78,0.3)',
  },
  errorText: {
    fontSize: fscale(12.5),
    fontWeight: '600',
    color: Colors.red,
  },
  spacer: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: hscale(10),
    paddingHorizontal: hscale(18),
    paddingBottom: vscale(32),
  },
  rejectButton: {
    height: hscale(60),
    width: hscale(70),
    borderRadius: hscale(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flex: 1,
    height: hscale(60),
    borderRadius: hscale(20),
    backgroundColor: Colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(10),
    shadowColor: Colors.lime,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  acceptButtonBusy: {
    opacity: 0.75,
  },
  acceptLabel: {
    fontSize: fscale(17),
    fontWeight: '800',
    color: Colors.ink,
  },
});
