import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Linking,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import RouteMapIllustration from '../../components/common/RouteMapIllustration';
import LiveRouteMap from '../../components/common/LiveRouteMap';
import RatingStars from '../../components/common/RatingStars';
import PrimaryButton from '../../components/common/PrimaryButton';
import PhoneIcon from '../../assets/icons/PhoneIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import RouteIcon from '../../assets/icons/RouteIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { getCookie } from '../../utils/session';
import { startRide } from '../../services/api/ridesService';
import { openTurnByTurnNavigation } from '../../utils/externalNavigation';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Arrived'>;
type ScreenRoute = RouteProp<RootStackParamList, 'Arrived'>;

const OTP_LENGTH = 4;
const MAP_HEIGHT = 180;

const ArrivedScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const req = PARTNER_RIDE_REQUEST;
  const ride = route.params?.ride;
  // Real passenger name — confirmed live in AcceptRide as flat
  // CustomerName/CustomerMobile fields. Falls back to a generic label
  // (never a fake specific name) for the rare case it's missing.
  const passengerName = ride?.CustomerName || t('common.passenger');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [starting, setStarting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // Ride is accepted and the partner is at pickup — no intentional way off
  // this screen except starting the ride, never the Android hardware back
  // button (which would otherwise drop the partner back to MainTabs with
  // the ride still accepted on the server).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const isOtpComplete = otp.every(d => d.length === 1);

  const handleNavigate = () => {
    if (!ride) return;
    openTurnByTurnNavigation({
      latitude: parseFloat(ride.Pickup.Latitude),
      longitude: parseFloat(ride.Pickup.Longitude),
      label: ride.Pickup.Address,
    });
  };

  // Same as PickupNav's handleCall — confirmed live in AcceptRide as
  // CustomerMobile.
  const handleCall = () => {
    const mobile = ride?.CustomerMobile;
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`);
  };

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (otpError) setOtpError(null);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleStartTrip = async () => {
    if (!isOtpComplete || starting) return;
    if (!ride?.RideTran) {
      setOtpError('Missing ride details. Please go back and try again.');
      return;
    }
    setOtpError(null);
    setStarting(true);
    try {
      const cookie = await getCookie();
      if (!cookie) throw new Error('Session not found. Please log in again.');
      const res = await startRide(cookie, ride.RideTran, otp.join(''));
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Incorrect OTP. Please try again.');
      }
      navigation.navigate('LiveTrip', { ride });
    } catch (err: any) {
      // Wrong OTP is the overwhelmingly common failure here — clear the
      // boxes and refocus the first one so the partner can immediately
      // retype rather than having to tap back into each box themselves.
      setOtpError(err?.message || 'Incorrect OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {ride ? (
          <LiveRouteMap
            destination={{
              latitude: parseFloat(ride.Pickup.Latitude),
              longitude: parseFloat(ride.Pickup.Longitude),
            }}
            destinationColor={Colors.green}
            // NOT ride.Route — that's the Pickup->Drop trip route, not
            // driver->pickup. Leaving encodedPolyline unset lets
            // LiveRouteMap draw its own Google Directions route from the
            // driver's live position to the pickup pin instead, same as
            // PickupNav.
            polylineColor={Colors.blue}
            // Partner's just arrived, not necessarily parked exactly on
            // the pickup pin — still worth showing the last stretch of
            // route/live position so they can see how close they really
            // are and nudge over if needed. Banner now shown here too,
            // same as PickupNav — no encodedPolyline is passed, so it
            // runs off the same fallback Google Directions steps.
          />
        ) : (
          <RouteMapIllustration />
        )}
        {!!ride && (
          <TouchableOpacity
            style={[styles.navigateButton, { top: insets.top + vscale(14) }]}
            onPress={handleNavigate}
          >
            <RouteIcon size={13} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.navigateLabel}>
              {t('pickupNav.navigateButton')}
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.arrivedBadge}>
          <View style={styles.arrivedDot} />
          <Text style={styles.arrivedText}>{t('arrived.arrivedAtPickup')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card pad={16}>
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
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <PhoneIcon size={20} color={Colors.lime} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={styles.destinationBox}>
            <Text style={styles.destinationEyebrow}>
              {t('arrived.destination')}
            </Text>
            <Text style={styles.destinationValue}>
              {ride?.Drop.Address || req.drop}
            </Text>
            <Text style={styles.destinationMeta}>
              {t('arrived.destinationMeta', {
                duration: ride
                  ? `${ride.TripDurationMinutes} min`
                  : req.duration,
                dist: ride ? `${ride.TripDistanceKM} km` : req.tripDist,
                earning: ride ? ride.EstimatedFare : req.earning,
              })}
            </Text>
          </View>
        </Card>

        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>{t('arrived.askForOtp')}</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => (otpRefs.current[i] = ref)}
                style={[styles.otpBox, otpError && styles.otpBoxError]}
                value={digit}
                onChangeText={val => handleOtpChange(val, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                editable={!starting}
              />
            ))}
          </View>
          {otpError ? (
            <View style={styles.otpErrorBox}>
              <Text style={styles.otpErrorText}>{otpError}</Text>
            </View>
          ) : (
            <View style={styles.verifyNote}>
              <ShieldIcon size={15} color={Colors.blue} strokeWidth={1.8} />
              <Text style={styles.verifyNoteText}>
                {t('arrived.verifyNote')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: vscale(20) + insets.bottom }]}
      >
        <PrimaryButton
          label={starting ? t('arrived.startingTrip') : t('arrived.startTrip')}
          onPress={handleStartTrip}
          icon="arrowRight"
          disabled={!isOtpComplete || starting}
          style={styles.fullButton}
        />
      </View>
    </View>
  );
};

export default ArrivedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  mapWrap: {
    height: vscale(MAP_HEIGHT),
    position: 'relative',
  },
  arrivedBadge: {
    position: 'absolute',
    bottom: vscale(12),
    left: '50%',
    transform: [{ translateX: -100 }],
    paddingVertical: vscale(8),
    paddingHorizontal: hscale(16),
    borderRadius: 99,
    backgroundColor: Colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  arrivedDot: {
    width: hscale(8),
    height: hscale(8),
    borderRadius: hscale(4),
    backgroundColor: '#FFFFFF',
  },
  arrivedText: {
    fontSize: fscale(12.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  navigateButton: {
    position: 'absolute',
    right: hscale(14),
    height: hscale(30),
    minWidth: hscale(90),
    paddingHorizontal: hscale(12),
    borderRadius: hscale(11),
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
    zIndex: 10,
  },
  navigateLabel: {
    color: '#FFFFFF',
    fontSize: fscale(11),
    fontWeight: '700',
  },
  scrollContent: {
    padding: hscale(18),
    paddingBottom: vscale(30),
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
    fontSize: fscale(16),
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
  callButton: {
    width: hscale(44),
    height: hscale(44),
    borderRadius: hscale(14),
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationBox: {
    marginTop: vscale(12),
    padding: hscale(12),
    backgroundColor: Colors.bg,
    borderRadius: hscale(12),
  },
  destinationEyebrow: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  destinationValue: {
    fontSize: fscale(13.5),
    fontWeight: '700',
    color: Colors.ink,
    marginTop: vscale(2),
  },
  destinationMeta: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(1),
  },
  otpSection: {
    marginTop: vscale(16),
  },
  otpLabel: {
    fontSize: fscale(12),
    fontWeight: '700',
    color: Colors.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: vscale(10),
  },
  otpRow: {
    flexDirection: 'row',
    gap: hscale(10),
  },
  otpBox: {
    flex: 1,
    height: vscale(64),
    borderRadius: hscale(18),
    backgroundColor: Colors.ink,
    fontSize: fscale(28),
    fontWeight: '800',
    color: Colors.lime,
    padding: 0,
  },
  otpBoxError: {
    borderWidth: 1.5,
    borderColor: Colors.red,
  },
  otpErrorBox: {
    marginTop: vscale(10),
    padding: hscale(12),
    backgroundColor: 'rgba(224,82,78,0.08)',
    borderRadius: hscale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
  },
  otpErrorText: {
    fontSize: fscale(12),
    fontWeight: '600',
    color: Colors.red,
    flex: 1,
  },
  verifyNote: {
    marginTop: vscale(10),
    padding: hscale(12),
    backgroundColor: 'rgba(46,125,255,0.06)',
    borderRadius: hscale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(8),
  },
  verifyNoteText: {
    fontSize: fscale(12),
    color: Colors.ink2,
  },
  footer: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(12),
  },
  fullButton: {
    width: '100%',
  },
});
