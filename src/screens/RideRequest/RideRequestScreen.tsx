import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Spinner from '../../components/common/Spinner';
import CashIcon from '../../assets/icons/CashIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import LocateIcon from '../../assets/icons/LocateIcon';
import CarIcon from '../../assets/icons/CarIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import { getCookie } from '../../utils/session';
import { acceptRide, PendingRide } from '../../services/api/ridesService';
import { useRidePollingContext } from '../../contexts/RidePollingContext';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'RideRequest'>;
type ScreenRoute = RouteProp<RootStackParamList, 'RideRequest'>;

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

  // Shares the exact same poll instance HomeScreen uses (see
  // contexts/RidePollingContext.tsx) rather than running an independent
  // one — two separate pollers here previously raced each other and could
  // wrongly conclude "no rides left" right after landing on this screen.
  // route.params.rides is just the instant-first-paint snapshot from
  // whichever tick sent the partner here; the shared context immediately
  // takes over as the live source of truth.
  const { incomingRides, hasFetchedOnce, dismissRide } =
    useRidePollingContext();
  const rides = hasFetchedOnce ? incomingRides : route.params?.rides ?? [];

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Every offer has expired/been taken/been declined while this screen was
  // open — nothing left to review, so head back rather than sit on a
  // blank list.
  useEffect(() => {
    if (hasFetchedOnce && rides.length === 0) {
      navigation.navigate('MainTabs');
    }
  }, [hasFetchedOnce, rides.length, navigation]);

  const handleAccept = async (ride: PendingRide) => {
    if (acceptingId) return;
    setErrors(prev => {
      if (!(ride.RideTran in prev)) return prev;
      const next = { ...prev };
      delete next[ride.RideTran];
      return next;
    });
    setAcceptingId(ride.RideTran);
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
      // it'll drop out of the list on the next poll tick regardless; the
      // inline message just explains why this particular tap didn't work.
      setErrors(prev => ({
        ...prev,
        [ride.RideTran]:
          err?.message ||
          'Could not accept this ride. It may have already been taken.',
      }));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = (ride: PendingRide) => dismissRide(ride.RideTran);

  const headerTitle =
    rides.length === 1
      ? t('rideRequest.titleOne')
      : t('rideRequest.titleMany', { count: rides.length });

  if (rides.length === 0) {
    // Between mount and the first successful poll tick (or right before
    // the auto-navigate-away effect above fires) — brief, so just a
    // spinner rather than a flash of empty UI.
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Spinner size={28} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>{t('rideRequest.incomingRequest')}</Text>
          <Text style={styles.title}>{headerTitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs')}
          style={styles.closeButton}
        >
          <CloseIcon size={18} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rides}
        keyExtractor={item => item.RideTran}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RideCard
            ride={item}
            accepting={acceptingId === item.RideTran}
            disabled={!!acceptingId && acceptingId !== item.RideTran}
            error={errors[item.RideTran]}
            onAccept={() => handleAccept(item)}
            onDecline={() => handleDecline(item)}
          />
        )}
      />
    </View>
  );
};

export default RideRequestScreen;

interface RideCardProps {
  ride: PendingRide;
  accepting: boolean;
  disabled: boolean;
  error?: string;
  onAccept: () => void;
  onDecline: () => void;
}

const RideCard: React.FC<RideCardProps> = ({
  ride,
  accepting,
  disabled,
  error,
  onAccept,
  onDecline,
}) => {
  const { t } = useTranslation();
  const pulse = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const dotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.vehicleChip}>
          <Animated.View style={[styles.liveDot, { opacity: dotOpacity }]} />
          <CarIcon size={13} color={Colors.lime} strokeWidth={2} />
          <Text style={styles.vehicleChipText}>
            {formatVehicleType(ride.VehicleType)}
          </Text>
        </View>
        <Text style={styles.fareText}>{ride.EstimatedFareText}</Text>
      </View>

      <Text style={styles.tripMeta}>
        {ride.TripDistanceKM} km {'\u00b7'} {ride.TripDurationMinutes} min
      </Text>

      <View style={styles.routeBlock}>
        <View style={styles.routeRow}>
          <View style={styles.pickupDot} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>
              {t('rideRequestSheet.pickupAway', {
                dist: `${ride.DistanceToPickupKM} km \u00b7 ${ride.ETAToPickupMinutes} min`,
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
            <Text style={styles.routeLabel}>{t('common.dropLabel')}</Text>
            <Text style={styles.routeValue} numberOfLines={1}>
              {ride.Drop.Address}
            </Text>
          </View>
        </View>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onDecline}
          style={styles.declineButton}
          disabled={accepting}
        >
          <CloseIcon size={18} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAccept}
          style={[styles.acceptButton, disabled && styles.acceptButtonDim]}
          activeOpacity={0.9}
          disabled={disabled}
        >
          {accepting ? (
            <Spinner size={18} color={Colors.ink} />
          ) : (
            <>
              <CheckIcon size={18} color={Colors.ink} strokeWidth={2.4} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: vscale(60),
    paddingHorizontal: hscale(20),
    paddingBottom: vscale(16),
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fscale(22),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: vscale(4),
  },
  closeButton: {
    width: hscale(34),
    height: hscale(34),
    borderRadius: hscale(17),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: hscale(18),
    paddingBottom: vscale(32),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: hscale(20),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: hscale(16),
    marginBottom: vscale(14),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    paddingVertical: vscale(5),
    paddingHorizontal: hscale(10),
    borderRadius: hscale(10),
    backgroundColor: 'rgba(200,242,96,0.12)',
  },
  liveDot: {
    width: hscale(6),
    height: hscale(6),
    borderRadius: hscale(3),
    backgroundColor: Colors.lime,
  },
  vehicleChipText: {
    fontSize: fscale(11.5),
    fontWeight: '700',
    color: Colors.lime,
  },
  fareText: {
    fontSize: fscale(20),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  tripMeta: {
    fontSize: fscale(12),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginTop: vscale(8),
  },
  routeBlock: {
    marginTop: vscale(10),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(5),
  },
  pickupDot: {
    width: hscale(9),
    height: hscale(9),
    borderRadius: hscale(4.5),
    backgroundColor: Colors.green,
    borderWidth: 2.5,
    borderColor: 'rgba(31,157,107,0.3)',
  },
  dropDot: {
    width: hscale(9),
    height: hscale(9),
    borderRadius: hscale(2),
    backgroundColor: '#FFFFFF',
  },
  routeConnector: {
    marginLeft: hscale(4.5),
    width: 0,
    height: vscale(14),
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fscale(10),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  routeValue: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: vscale(1),
  },
  errorBanner: {
    marginTop: vscale(10),
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(10),
    backgroundColor: 'rgba(224,82,78,0.14)',
    borderWidth: 0.5,
    borderColor: 'rgba(224,82,78,0.3)',
  },
  errorText: {
    fontSize: fscale(11.5),
    fontWeight: '600',
    color: Colors.red,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: hscale(10),
    marginTop: vscale(14),
  },
  declineButton: {
    width: hscale(48),
    height: hscale(48),
    borderRadius: hscale(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flex: 1,
    height: hscale(48),
    borderRadius: hscale(16),
    backgroundColor: Colors.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
  },
  acceptButtonDim: {
    opacity: 0.5,
  },
  acceptLabel: {
    fontSize: fscale(14.5),
    fontWeight: '800',
    color: Colors.ink,
  },
});
