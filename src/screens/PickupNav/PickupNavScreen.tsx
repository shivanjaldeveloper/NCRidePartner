import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  useWindowDimensions,
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
import Spinner from '../../components/common/Spinner';
import RatingStars from '../../components/common/RatingStars';
import PrimaryButton from '../../components/common/PrimaryButton';
import SosIcon from '../../assets/icons/SosIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import PhoneIcon from '../../assets/icons/PhoneIcon';
import CloseIcon from '../../assets/icons/CloseIcon';
import RouteIcon from '../../assets/icons/RouteIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { getCookie } from '../../utils/session';
import { cancelAcceptedRide } from '../../services/api/ridesService';
import { openTurnByTurnNavigation } from '../../utils/externalNavigation';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'PickupNav'>;
type ScreenRoute = RouteProp<RootStackParamList, 'PickupNav'>;

const MAP_HEIGHT_RATIO = 0.6;
// Height of each button in the bottom row plus the gap we want to keep
// above the bottom sheet. Used below both to size the row's own bottom
// offset and to lift the map's recenter button clear of it.
const BUTTON_ROW_HEIGHT = hscale(36);
const BUTTON_ROW_MARGIN = vscale(14);

const PickupNavScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { t } = useTranslation();
  const req = PARTNER_RIDE_REQUEST;
  const ride = route.params?.ride;
  const rideTran = ride?.RideTran;
  // Real passenger name — confirmed live in AcceptRide as flat
  // CustomerName/CustomerMobile fields. Falls back to a generic label
  // (never a fake specific name) for the rare case it's missing.
  const passengerName = ride?.CustomerName || t('common.passenger');
  const [cancelling, setCancelling] = useState(false);
  const [liveProgress, setLiveProgress] = useState<RouteProgress | null>(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  // The bottom sheet's height is driven by its own content (ETA strip,
  // passenger row, pickup box, button — plus the safe-area inset it pads
  // itself with), not a fixed fraction of the screen, so on a short
  // device or one with a tall gesture bar it can grow past the ~40% of
  // screen height left below the map and creep up over the map's bottom
  // edge — covering the button row if that row sits at a fixed offset.
  // Measuring the sheet's real height and comparing it against the space
  // actually reserved for it (window height minus the map's height)
  // tells us exactly how far it's intruding, so the row can be pushed up
  // by exactly that much on every device instead of a guessed constant.
  const nonMapHeight = windowHeight * (1 - MAP_HEIGHT_RATIO);
  const sheetOverlap = Math.max(0, sheetHeight - nonMapHeight);
  const buttonRowBottom = BUTTON_ROW_MARGIN + sheetOverlap;

  const handleNavigate = () => {
    if (!ride) return;
    openTurnByTurnNavigation({
      latitude: parseFloat(ride.Pickup.Latitude),
      longitude: parseFloat(ride.Pickup.Longitude),
      label: ride.Pickup.Address,
    });
  };

  // Confirmed live in AcceptRide as CustomerMobile — dials straight out.
  const handleCall = () => {
    const mobile = ride?.CustomerMobile;
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`);
  };

  const confirmCancel = () => {
    if (!rideTran || cancelling) return;
    Alert.alert(
      t('pickupNav.cancelConfirmTitle'),
      t('pickupNav.cancelConfirmBody'),
      [
        { text: t('pickupNav.cancelConfirmBack'), style: 'cancel' },
        {
          text: t('pickupNav.cancelConfirmYes'),
          style: 'destructive',
          onPress: handleCancel,
        },
      ],
    );
  };

  const handleCancel = async () => {
    if (!rideTran) return;
    setCancelling(true);
    try {
      const cookie = await getCookie();
      if (!cookie) throw new Error('Session not found. Please log in again.');
      const res = await cancelAcceptedRide(cookie, rideTran, 'CANCELLED');
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Could not cancel this ride.');
      }
      navigation.navigate('MainTabs');
    } catch (err: any) {
      Alert.alert(
        t('pickupNav.cancelFailedTitle'),
        err?.message || 'Could not cancel this ride. Please try again.',
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { height: `${MAP_HEIGHT_RATIO * 100}%` }]}>
        {ride ? (
          <LiveRouteMap
            destination={{
              latitude: parseFloat(ride.Pickup.Latitude),
              longitude: parseFloat(ride.Pickup.Longitude),
            }}
            destinationColor={Colors.green}
            // NOT ride.Route — that's the Pickup->Drop trip route, not
            // the driver->pickup leg this screen is for (that was
            // showing the wrong line, cutting across from pickup to
            // drop instead of starting from wherever the driver actually
            // is). No encodedPolyline here at all lets LiveRouteMap fall
            // back to its own Google Directions route, computed live from
            // the driver's current position straight to the pickup pin —
            // the same in-app map, just anchored to the right two points.
            polylineColor={Colors.blue}
            onProgressChange={setLiveProgress}
            // Clears the SOS/Navigate/Cancel row anchored along the
            // bottom of the map — recalculated below alongside the row
            // itself so it always floats just above it, on every device.
            recenterOffsetBottom={
              buttonRowBottom + BUTTON_ROW_HEIGHT + vscale(12)
            }
          />
        ) : (
          <RouteMapIllustration />
        )}

        <View style={[styles.buttonRow, { bottom: buttonRowBottom }]}>
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

          {!!rideTran && (
            <TouchableOpacity
              style={styles.cancelRideButton}
              onPress={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <Spinner size={14} color="#FFFFFF" />
              ) : (
                <>
                  <CloseIcon size={13} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.cancelRideLabel}>
                    {t('pickupNav.cancelRide')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View
        style={styles.sheetAnchor}
        onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
      >
        <BottomSheetPanel>
          <View style={styles.etaStrip}>
            <View style={styles.etaSpinnerWrap}>
              <Spinner size={22} />
            </View>
            <View style={styles.etaTextWrap}>
              <Text style={styles.etaEyebrow}>
                {t('pickupNav.headingToPickup')}
              </Text>
              <Text style={styles.etaValue}>
                {t('pickupNav.etaValue', {
                  duration: liveProgress
                    ? `${Math.max(
                        1,
                        Math.round(liveProgress.etaSeconds / 60),
                      )} min`
                    : ride
                    ? `${ride.ETAToPickupMinutes} min`
                    : '4 min',
                })}
              </Text>
            </View>
            <Text style={styles.etaDist}>
              {t('pickupNav.away', {
                dist: liveProgress
                  ? `${(liveProgress.distanceMeters / 1000).toFixed(1)} km`
                  : ride
                  ? `${ride.DistanceToPickupKM} km`
                  : req.pickupDist,
              })}
            </Text>
          </View>

          <View style={styles.passengerRow}>
            <View style={styles.passengerAvatar}>
              <Text style={styles.passengerAvatarText}>
                {passengerName
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.passengerTextWrap}>
              <Text style={styles.passengerName}>{passengerName}</Text>
              <View style={styles.passengerMetaRow}>
                <RatingStars value={req.passengerRating} />
                <Text style={styles.passengerMetaText}>
                  {t('pickupNav.tripsSuffix', { count: req.passengerTrips })}
                </Text>
              </View>
            </View>
            <View style={styles.passengerActions}>
              <TouchableOpacity style={styles.chatButton}>
                <ChatIcon size={20} color={Colors.ink} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <PhoneIcon size={20} color={Colors.lime} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.pickupBox}>
            <View style={styles.pickupDot} />
            <View>
              <Text style={styles.pickupEyebrow}>
                {t('pickupNav.pickupLabel')}
              </Text>
              <Text style={styles.pickupValue}>
                {ride?.Pickup.Address || req.pickup}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label={t('pickupNav.arrivedButton')}
            onPress={() => navigation.navigate('Arrived', { ride })}
            icon="none"
            style={styles.fullButton}
          />
        </BottomSheetPanel>
      </View>
    </View>
  );
};

export default PickupNavScreen;

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
  buttonRow: {
    position: 'absolute',
    left: hscale(18),
    right: hscale(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: hscale(8),
    zIndex: 10,
  },
  sosButton: {
    height: hscale(36),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: Colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    flex: 1,
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: fscale(12),
    fontWeight: '700',
  },
  navigateButton: {
    height: hscale(36),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    flex: 1,
  },
  navigateLabel: {
    color: '#FFFFFF',
    fontSize: fscale(11.5),
    fontWeight: '700',
  },
  cancelRideButton: {
    height: hscale(36),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(15,17,21,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    flex: 1,
  },
  cancelRideLabel: {
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
  etaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    paddingVertical: vscale(6),
    paddingHorizontal: hscale(10),
    backgroundColor: Colors.ink,
    borderRadius: hscale(14),
    marginBottom: vscale(14),
  },
  etaSpinnerWrap: {
    width: hscale(32),
    height: hscale(32),
    borderRadius: hscale(10),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaTextWrap: {
    flex: 1,
  },
  etaEyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  etaValue: {
    fontSize: fscale(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  etaDist: {
    fontSize: fscale(12.5),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  passengerAvatar: {
    width: hscale(52),
    height: hscale(52),
    borderRadius: hscale(26),
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fscale(16),
  },
  passengerTextWrap: {
    flex: 1,
  },
  passengerName: {
    fontSize: fscale(15),
    fontWeight: '700',
    color: Colors.ink,
  },
  passengerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    marginTop: vscale(2),
  },
  passengerMetaText: {
    fontSize: fscale(11.5),
    color: Colors.mute,
  },
  passengerActions: {
    flexDirection: 'row',
    gap: hscale(8),
  },
  chatButton: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(14),
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(14),
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupBox: {
    marginTop: vscale(12),
    padding: hscale(12),
    paddingHorizontal: hscale(12),
    backgroundColor: 'rgba(46,125,255,0.06)',
    borderRadius: hscale(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
  },
  pickupDot: {
    width: hscale(8),
    height: hscale(8),
    borderRadius: hscale(4),
    backgroundColor: Colors.green,
  },
  pickupEyebrow: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickupValue: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
  },
  fullButton: {
    width: '100%',
    marginTop: vscale(14),
  },
});
