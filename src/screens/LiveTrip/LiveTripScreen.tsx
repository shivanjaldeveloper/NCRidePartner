import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import RouteMapIllustration from '../../components/common/RouteMapIllustration';
import LiveRouteMap, {
  RouteProgress,
} from '../../components/common/LiveRouteMap';
import BottomSheetPanel from '../../components/common/BottomSheetPanel';
import PrimaryButton from '../../components/common/PrimaryButton';
import SosIcon from '../../assets/icons/SosIcon';
import CashIcon from '../../assets/icons/CashIcon';
import StarFillIcon from '../../assets/icons/StarFillIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import RouteIcon from '../../assets/icons/RouteIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { getCookie } from '../../utils/session';
import { getCurrentPositionQuick } from '../../utils/locationTracker';
import { completeRide } from '../../services/api/ridesService';
import { openTurnByTurnNavigation } from '../../utils/externalNavigation';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'LiveTrip'>;
type ScreenRoute = RouteProp<RootStackParamList, 'LiveTrip'>;

const MAP_HEIGHT_RATIO = 0.6;
// id is the stable identity for the key prop; labelKey resolves through the
// active language at render time.
const STEPS = [
  { id: 'pickedUp', labelKey: 'liveTrip.steps.pickedUp' },
  { id: 'onTrip', labelKey: 'liveTrip.steps.onTrip' },
  { id: 'arriving', labelKey: 'liveTrip.steps.arriving' },
  { id: 'complete', labelKey: 'liveTrip.steps.complete' },
];
const ACTIVE_STEP_INDEX = 1; // trip is in progress — "On trip" is current

// Complete Trip stays disabled for this long after the screen mounts, to
// prevent an accidental/immediate tap right after pickup.
const COMPLETE_TRIP_LOCK_MS = 2 * 60 * 1000;

const LiveTripScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { t } = useTranslation();
  const req = PARTNER_RIDE_REQUEST;
  const ride = route.params?.ride;
  const [completing, setCompleting] = useState(false);
  const [liveProgress, setLiveProgress] = useState<RouteProgress | null>(null);
  const [canComplete, setCanComplete] = useState(false);

  // Ride is in progress with the passenger on board — no intentional way
  // off this screen except completing the trip, never the Android hardware
  // back button (which would otherwise drop the partner back to MainTabs
  // mid-trip with the ride still active on the server).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Lock the Complete Trip button for COMPLETE_TRIP_LOCK_MS from when this
  // screen opens.
  useEffect(() => {
    const timer = setTimeout(() => setCanComplete(true), COMPLETE_TRIP_LOCK_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = () => {
    if (!ride) return;
    openTurnByTurnNavigation({
      latitude: parseFloat(ride.Drop.Latitude),
      longitude: parseFloat(ride.Drop.Longitude),
      label: ride.Drop.Address,
    });
  };

  const handleCompleteTrip = async () => {
    if (completing || !canComplete) return;
    if (!ride?.RideTran) {
      Alert.alert('', 'Missing ride details. Please go back and try again.');
      return;
    }
    setCompleting(true);
    try {
      const cookie = await getCookie();
      if (!cookie) throw new Error('Session not found. Please log in again.');
      const position = await getCurrentPositionQuick();
      const { latitude, longitude } = position.coords;
      const res = await completeRide(
        cookie,
        ride.RideTran,
        latitude,
        longitude,
      );
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Could not complete this ride.');
      }
      navigation.navigate('TripEarnings', {
        ride,
        fare: res.EstimatedFare,
        fareText: res.EstimatedFareText,
      });
    } catch (err: any) {
      Alert.alert(
        'Could not complete ride',
        err?.message || 'Please try again.',
      );
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { height: `${MAP_HEIGHT_RATIO * 100}%` }]}>
        {ride ? (
          <LiveRouteMap
            destination={{
              latitude: parseFloat(ride.Drop.Latitude),
              longitude: parseFloat(ride.Drop.Longitude),
            }}
            destinationColor={Colors.ink}
            encodedPolyline={ride.Route?.EncodedPolyline}
            polylineColor={ride.Route?.PolylineColor || Colors.blue}
            // This is the server's real Pickup->Drop route — always draw
            // that, never a route computed from the driver's current
            // position to Drop. fallbackRoute off means no Google
            // Directions call (fallback or off-route reroute) happens on
            // this screen at all, so the drawn line stays exactly the
            // backend polyline no matter where the driver actually is.
            fallbackRoute={false}
            onProgressChange={setLiveProgress}
          />
        ) : (
          <RouteMapIllustration />
        )}
      </View>

      <TouchableOpacity style={styles.sosButton}>
        <SosIcon size={14} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.sosLabel}>{t('common.sos')}</Text>
      </TouchableOpacity>

      {!!ride && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleNavigate}
        >
          <RouteIcon size={13} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.navigateLabel}>
            {t('pickupNav.navigateButton')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.sheetAnchor}>
        <BottomSheetPanel>
          <View style={styles.destinationStrip}>
            <View style={styles.destinationDot} />
            <View style={styles.destinationTextWrap}>
              <Text style={styles.destinationEyebrow}>
                {t('arrived.destination')}
              </Text>
              <Text style={styles.destinationValue}>
                {ride?.Drop.Address || req.drop}
              </Text>
            </View>
            <View style={styles.destinationEtaWrap}>
              <Text style={styles.destinationEta}>
                {t('liveTrip.eta', {
                  duration: liveProgress
                    ? `${Math.max(
                        1,
                        Math.round(liveProgress.etaSeconds / 60),
                      )} min`
                    : ride
                    ? `${ride.TripDurationMinutes} min`
                    : req.duration,
                })}
              </Text>
              <Text style={styles.destinationDist}>
                {liveProgress
                  ? `${(liveProgress.distanceMeters / 1000).toFixed(1)} km`
                  : ride
                  ? `${ride.TripDistanceKM} km`
                  : req.tripDist}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            {STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
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
                    {t(step.labelKey)}
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
                <Text style={styles.earningsValue}>
                  {ride?.EstimatedFareText || `₹${req.earning}`}
                </Text>
                <Text style={styles.earningsLabel}>
                  {t('liveTrip.estEarning')}
                </Text>
              </View>
            </View>
            <View style={styles.earningsBox}>
              <StarFillIcon size={16} color={Colors.amber} />
              <View>
                <Text style={styles.earningsValue}>{req.passengerRating}</Text>
                <Text style={styles.earningsLabel}>
                  {t('liveTrip.passenger')}
                </Text>
              </View>
            </View>
          </View>

          <PrimaryButton
            label={
              completing ? t('liveTrip.completing') : t('liveTrip.completeTrip')
            }
            onPress={handleCompleteTrip}
            icon={completing ? 'none' : 'check'}
            disabled={completing || !canComplete}
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
  navigateButton: {
    position: 'absolute',
    top: vscale(108),
    right: hscale(18),
    height: hscale(32),
    minWidth: hscale(96),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    zIndex: 10,
  },
  navigateLabel: {
    color: '#FFFFFF',
    fontSize: fscale(11.5),
    fontWeight: '700',
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
