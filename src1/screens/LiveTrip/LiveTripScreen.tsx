import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import RouteMapIllustration from '../../components/common/RouteMapIllustration';
import BottomSheetPanel from '../../components/common/BottomSheetPanel';
import PrimaryButton from '../../components/common/PrimaryButton';
import SosIcon from '../../assets/icons/SosIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import CashIcon from '../../assets/icons/CashIcon';
import StarFillIcon from '../../assets/icons/StarFillIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'LiveTrip'>;

const MAP_HEIGHT_RATIO = 0.6;
const STEPS = ['Picked up', 'On trip', 'Arriving', 'Complete'];
const ACTIVE_STEP_INDEX = 1; // trip is in progress — "On trip" is current

const LiveTripScreen = () => {
  const navigation = useNavigation<NavProp>();
  const req = PARTNER_RIDE_REQUEST;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { height: `${MAP_HEIGHT_RATIO * 100}%` }]}>
        <RouteMapIllustration />
      </View>

      <TouchableOpacity style={styles.sosButton}>
        <SosIcon size={14} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.sosLabel}>SOS</Text>
      </TouchableOpacity>

      <View style={styles.timerBadge}>
        <ClockIcon size={14} color={Colors.lime} strokeWidth={1.8} />
        <Text style={styles.timerText}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      </View>

      <View style={styles.sheetAnchor}>
        <BottomSheetPanel>
          <View style={styles.destinationStrip}>
            <View style={styles.destinationDot} />
            <View style={styles.destinationTextWrap}>
              <Text style={styles.destinationEyebrow}>Destination</Text>
              <Text style={styles.destinationValue}>{req.drop}</Text>
            </View>
            <View style={styles.destinationEtaWrap}>
              <Text style={styles.destinationEta}>ETA {req.duration}</Text>
              <Text style={styles.destinationDist}>{req.tripDist}</Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <View style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor:
                          i <= ACTIVE_STEP_INDEX
                            ? Colors.ink
                            : 'rgba(15,17,21,0.12)',
                      },
                    ]}
                  >
                    {i < ACTIVE_STEP_INDEX && (
                      <CheckIcon size={12} color="#FFFFFF" strokeWidth={2.4} />
                    )}
                    {i === ACTIVE_STEP_INDEX && (
                      <View style={styles.progressDotInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      {
                        color:
                          i <= ACTIVE_STEP_INDEX ? Colors.ink : Colors.mute,
                        fontWeight: i === ACTIVE_STEP_INDEX ? '700' : '500',
                      },
                    ]}
                  >
                    {step}
                  </Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      {
                        backgroundColor:
                          i < ACTIVE_STEP_INDEX
                            ? Colors.ink
                            : 'rgba(15,17,21,0.1)',
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.earningsRow}>
            <View style={styles.earningsBox}>
              <CashIcon size={16} color={Colors.ink} strokeWidth={1.8} />
              <View>
                <Text style={styles.earningsValue}>₹{req.earning}</Text>
                <Text style={styles.earningsLabel}>Est. earning</Text>
              </View>
            </View>
            <View style={styles.earningsBox}>
              <StarFillIcon size={16} color={Colors.amber} />
              <View>
                <Text style={styles.earningsValue}>{req.passengerRating}</Text>
                <Text style={styles.earningsLabel}>Passenger</Text>
              </View>
            </View>
          </View>

          <PrimaryButton
            label="Complete Trip"
            onPress={() => navigation.navigate('TripEarnings')}
            icon="check"
            style={styles.fullButton}
          />
        </BottomSheetPanel>
      </View>
    </View>
  );
};

export default LiveTripScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  mapWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  sosButton: {
    position: 'absolute',
    top: vscale(64),
    right: hscale(18),
    height: hscale(36),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: Colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    zIndex: 10,
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: fscale(12),
    fontWeight: '700',
  },
  timerBadge: {
    position: 'absolute',
    top: vscale(64),
    left: hscale(18),
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(14),
    borderRadius: hscale(14),
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
    zIndex: 10,
  },
  timerText: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  sheetAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  destinationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    padding: hscale(10),
    paddingHorizontal: hscale(12),
    backgroundColor: Colors.bg,
    borderRadius: hscale(14),
    marginBottom: vscale(12),
  },
  destinationDot: {
    width: hscale(10),
    height: hscale(10),
    borderRadius: 2,
    backgroundColor: Colors.ink,
  },
  destinationTextWrap: {
    flex: 1,
  },
  destinationEyebrow: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  destinationValue: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  destinationEtaWrap: {
    alignItems: 'flex-end',
  },
  destinationEta: {
    fontSize: fscale(13),
    fontWeight: '700',
    color: Colors.ink,
  },
  destinationDist: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vscale(14),
  },
  progressStep: {
    alignItems: 'center',
    gap: vscale(3),
  },
  progressDot: {
    width: hscale(20),
    height: hscale(20),
    borderRadius: hscale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotInner: {
    width: hscale(6),
    height: hscale(6),
    borderRadius: hscale(3),
    backgroundColor: Colors.lime,
  },
  progressLabel: {
    fontSize: fscale(9.5),
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: hscale(4),
    marginBottom: vscale(14),
  },
  earningsRow: {
    flexDirection: 'row',
    gap: hscale(8),
    marginBottom: vscale(14),
  },
  earningsBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
    padding: hscale(12),
    backgroundColor: Colors.bg,
    borderRadius: hscale(14),
  },
  earningsValue: {
    fontSize: fscale(14),
    fontWeight: '800',
    color: Colors.ink,
  },
  earningsLabel: {
    fontSize: fscale(10.5),
    color: Colors.mute,
  },
  fullButton: {
    width: '100%',
  },
});
