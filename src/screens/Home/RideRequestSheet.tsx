import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import CloseIcon from '../../assets/icons/CloseIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import StarFillIcon from '../../assets/icons/StarFillIcon';
import { RideRequest } from './mockHomeData';

interface Props {
  visible: boolean;
  request: RideRequest;
  onClose: () => void;
  onAccept: () => void;
}

const SHEET_HEIGHT = 420;

const RideRequestSheet: React.FC<Props> = ({
  visible,
  request,
  onClose,
  onAccept,
}) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const pulse = useRef(new Animated.Value(0)).current;

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

  if (!visible) return null;

  const dotOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.pulseDot, { opacity: dotOpacity }]} />
          <Text style={styles.headerLabel}>New ride request</Text>
        </View>

        <View style={styles.routeBlock}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>
                Pickup · {request.pickupDist} away
              </Text>
              <Text style={styles.routeValue}>{request.pickup}</Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={styles.dropDot} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>
                Drop · {request.tripDist} trip
              </Text>
              <Text style={styles.routeValue}>{request.drop}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { v: `₹${request.earning}`, l: 'Earning' },
            { v: request.duration, l: 'Duration' },
            { v: request.payment, l: 'Payment' },
          ].map(item => (
            <View key={item.l} style={styles.statBox}>
              <Text style={styles.statValue}>{item.v}</Text>
              <Text style={styles.statLabel}>{item.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.passengerAvatarText}>
              {request.passengerName
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.passengerTextWrap}>
            <Text style={styles.passengerName}>{request.passengerName}</Text>
            <Text style={styles.passengerMeta}>
              {request.passengerTrips} trips · {request.service}
            </Text>
          </View>
          <View style={styles.ratingWrap}>
            <StarFillIcon size={13} color={Colors.amber} />
            <Text style={styles.ratingText}>{request.passengerRating}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onClose} style={styles.declineButton}>
            <CloseIcon size={22} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onAccept}
            style={styles.acceptButton}
            activeOpacity={0.9}
          >
            <CheckIcon size={22} color={Colors.ink} strokeWidth={2.4} />
            <Text style={styles.acceptLabel}>Accept Ride</Text>
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
    marginBottom: vscale(16),
  },
  passengerAvatar: {
    width: hscale(36),
    height: hscale(36),
    borderRadius: hscale(18),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fscale(13),
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
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    marginTop: vscale(1),
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(4),
  },
  ratingText: {
    fontSize: fscale(13),
    fontWeight: '700',
    color: '#FFFFFF',
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
