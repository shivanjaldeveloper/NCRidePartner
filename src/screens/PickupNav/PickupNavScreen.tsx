import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import RouteMapIllustration from '../../components/common/RouteMapIllustration';
import BottomSheetPanel from '../../components/common/BottomSheetPanel';
import Spinner from '../../components/common/Spinner';
import RatingStars from '../../components/common/RatingStars';
import PrimaryButton from '../../components/common/PrimaryButton';
import SosIcon from '../../assets/icons/SosIcon';
import ChatIcon from '../../assets/icons/ChatIcon';
import PhoneIcon from '../../assets/icons/PhoneIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'PickupNav'>;

const MAP_HEIGHT_RATIO = 0.6;

const PickupNavScreen = () => {
  const navigation = useNavigation<NavProp>();
  const req = PARTNER_RIDE_REQUEST;

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { height: `${MAP_HEIGHT_RATIO * 100}%` }]}>
        <RouteMapIllustration />
      </View>

      <TouchableOpacity style={styles.sosButton}>
        <SosIcon size={14} color="#FFFFFF" strokeWidth={2} />
        <Text style={styles.sosLabel}>SOS</Text>
      </TouchableOpacity>

      <View style={styles.sheetAnchor}>
        <BottomSheetPanel>
          <View style={styles.etaStrip}>
            <View style={styles.etaSpinnerWrap}>
              <Spinner size={22} />
            </View>
            <View style={styles.etaTextWrap}>
              <Text style={styles.etaEyebrow}>Heading to pickup</Text>
              <Text style={styles.etaValue}>ETA · 4 min</Text>
            </View>
            <Text style={styles.etaDist}>{req.pickupDist} away</Text>
          </View>

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
                  · {req.passengerTrips} trips
                </Text>
              </View>
            </View>
            <View style={styles.passengerActions}>
              <TouchableOpacity style={styles.chatButton}>
                <ChatIcon size={20} color={Colors.ink} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton}>
                <PhoneIcon size={20} color={Colors.lime} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.pickupBox}>
            <View style={styles.pickupDot} />
            <View>
              <Text style={styles.pickupEyebrow}>Pickup</Text>
              <Text style={styles.pickupValue}>{req.pickup}</Text>
            </View>
          </View>

          <PrimaryButton
            label="I've Arrived at Pickup"
            onPress={() => navigation.navigate('Arrived')}
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
