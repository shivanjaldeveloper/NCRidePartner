import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import CarIcon from '../../assets/icons/CarIcon';
import { PendingRide } from '../../services/api/ridesService';

interface Props {
  visible: boolean;
  ride: PendingRide | null;
  /** Server-reported offer window, in seconds (GetPendingRides.OfferExpirySeconds). */
  expirySeconds: number;
  onClose: () => void;
  onAccept: (ride: PendingRide) => void;
}

const SHEET_HEIGHT = 420;

// "CAR" -> "Car", "CAR_XL" -> "Car Xl" — best-effort label for whatever
// VehicleType string the server sends, without hardcoding a lookup table
// that'll drift out of sync with new vehicle types added server-side.
function formatVehicleType(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .split(/[\s_]+/)
    .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const RideRequestSheet: React.FC<Props> = ({
  visible,
  ride,
  expirySeconds,
  onClose,
  onAccept,
}) => {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [secondsLeft, setSecondsLeft] = useState(expirySeconds);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_HEIGHT,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  // Resets and starts a fresh local countdown every time a new ride offer
  // comes in (keyed off RideTran, not just `visible` — a new offer while
  // one is already showing should restart the clock, not keep the old
  // one's remaining time). Auto-dismisses via onClose when it hits 0,
  // matching the server's own offer expiry so the sheet never sits open
  // on a dead offer waiting for the next poll tick to notice.
  useEffect(() => {
    if (!visible || !ride) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    setSecondsLeft(expirySeconds);
    countdownRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onCloseRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ride?.RideTran, expirySeconds]);

  if (!visible || !ride) return null;

  const dotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  const urgent = secondsLeft <= 10;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.pulseDot, { opacity: dotOpacity }]} />
          <Text style={styles.headerLabel}>
            {t('rideRequestSheet.newRideRequest')}
          </Text>
          <View style={styles.spacerFlex} />
          <View
            style={[styles.countdownPill, urgent && styles.countdownPillUrgent]}
          >
            <Text
              style={[
                styles.countdownText,
                urgent && styles.countdownTextUrgent,
              ]}
            >
              {t('rideRequestSheet.expiresIn', { sec: secondsLeft })}
            </Text>
          </View>
        </View>

        <View style={styles.routeBlock}>
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
        </View>

        <View style={styles.statsRow}>
          {[
            {
              v: ride.EstimatedFareText,
              key: 'earning',
              labelKey: 'rideRequestSheet.stats.earning',
            },
            {
              v: `${ride.TripDurationMinutes} min`,
              key: 'duration',
              labelKey: 'rideRequestSheet.stats.duration',
            },
            {
              v: `${ride.ETAToPickupMinutes} min`,
              key: 'eta',
              labelKey: 'rideRequestSheet.stats.eta',
            },
          ].map(item => (
            <View key={item.key} style={styles.statBox}>
              <Text style={styles.statValue}>{item.v}</Text>
              <Text style={styles.statLabel}>{t(item.labelKey)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIconWrap}>
            <CarIcon size={18} color={Colors.lime} strokeWidth={1.8} />
          </View>
          <View style={styles.vehicleTextWrap}>
            <Text style={styles.vehicleLabel}>
              {t('rideRequestSheet.vehicle')}
            </Text>
            <Text style={styles.vehicleValue}>
              {formatVehicleType(ride.VehicleType)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onClose} style={styles.declineButton}>
            <CloseIcon size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAccept(ride)}
            style={styles.acceptButton}
            activeOpacity={0.9}
          >
            <CheckIcon size={22} color={Colors.ink} strokeWidth={2.4} />
            <Text style={styles.acceptLabel}>
              {t('rideRequestSheet.acceptRide')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default RideRequestSheet;

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: 'rgba(15,17,21,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.ink,
    borderTopLeftRadius: hscale(28),
    borderTopRightRadius: hscale(28),
    paddingHorizontal: hscale(18),
    paddingTop: vscale(20),
    paddingBottom: vscale(36),
    maxHeight: SCREEN_H * 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
    marginBottom: vscale(14),
  },
  pulseDot: {
    width: hscale(8),
    height: hscale(8),
    borderRadius: hscale(4),
    backgroundColor: Colors.lime,
  },
  headerLabel: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spacerFlex: {
    flex: 1,
  },
  countdownPill: {
    paddingVertical: vscale(4),
    paddingHorizontal: hscale(9),
    borderRadius: hscale(10),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  countdownPillUrgent: {
    backgroundColor: 'rgba(224,82,78,0.18)',
  },
  countdownText: {
    fontSize: fscale(11),
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  countdownTextUrgent: {
    color: Colors.red,
  },
  routeBlock: {
    marginBottom: vscale(14),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(6),
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
    height: vscale(16),
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
    letterSpacing: 0.4,
  },
  routeValue: {
    fontSize: fscale(15),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: vscale(2),
  },
  statsRow: {
    flexDirection: 'row',
    gap: hscale(8),
    marginBottom: vscale(14),
  },
  statBox: {
    flex: 1,
    paddingVertical: vscale(10),
    borderRadius: hscale(14),
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: fscale(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: fscale(10),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginTop: vscale(2),
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    paddingVertical: vscale(10),
    paddingHorizontal: hscale(14),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: hscale(14),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: vscale(16),
  },
  vehicleIconWrap: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(18),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTextWrap: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: fscale(10),
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vehicleValue: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: vscale(1),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: hscale(10),
  },
  declineButton: {
    height: hscale(56),
    width: hscale(64),
    borderRadius: hscale(18),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flex: 1,
    height: hscale(56),
    borderRadius: hscale(18),
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
  acceptLabel: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: Colors.ink,
  },
});
