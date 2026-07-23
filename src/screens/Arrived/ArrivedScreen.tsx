import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import RouteMapIllustration from '../../components/common/RouteMapIllustration';
import RatingStars from '../../components/common/RatingStars';
import PrimaryButton from '../../components/common/PrimaryButton';
import PhoneIcon from '../../assets/icons/PhoneIcon';
import ShieldIcon from '../../assets/icons/ShieldIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Arrived'>;

const OTP_LENGTH = 4;
const MAP_HEIGHT = 180;

const ArrivedScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();
  const req = PARTNER_RIDE_REQUEST;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const isOtpComplete = otp.every(d => d.length === 1);

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
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

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <RouteMapIllustration />
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
                {req.passengerName
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.passengerTextWrap}>
              <Text style={styles.passengerName}>{req.passengerName}</Text>
              <View style={styles.passengerMetaRow}>
                <RatingStars value={req.passengerRating} />
                <Text style={styles.passengerMetaText}>
                  {t('pickupNav.tripsSuffix', { count: req.passengerTrips })}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <PhoneIcon size={20} color={Colors.lime} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={styles.destinationBox}>
            <Text style={styles.destinationEyebrow}>
              {t('arrived.destination')}
            </Text>
            <Text style={styles.destinationValue}>{req.drop}</Text>
            <Text style={styles.destinationMeta}>
              {t('arrived.destinationMeta', {
                duration: req.duration,
                dist: req.tripDist,
                earning: req.earning,
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
                style={styles.otpBox}
                value={digit}
                onChangeText={val => handleOtpChange(val, i)}
                onKeyPress={e => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>
          <View style={styles.verifyNote}>
            <ShieldIcon size={15} color={Colors.blue} strokeWidth={1.8} />
            <Text style={styles.verifyNoteText}>{t('arrived.verifyNote')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={t('arrived.startTrip')}
          onPress={() => navigation.navigate('LiveTrip')}
          icon="arrowRight"
          disabled={!isOtpComplete}
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
    paddingBottom: vscale(44),
  },
  fullButton: {
    width: '100%',
  },
});
