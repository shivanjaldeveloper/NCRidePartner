import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import CashIcon from '../../assets/icons/CashIcon';
import ActivityIcon from '../../assets/icons/ActivityIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'TripEarnings'>;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TripEarningsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const req = PARTNER_RIDE_REQUEST;

  const earning = req.earning || 186;
  const base = 45;
  const dist = 112;
  const time = 36;
  const platform = Math.round(earning * 0.08);
  const tds = Math.round(earning * 0.01);
  const net = earning - platform - tds;

  const checkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(checkProgress, {
      toValue: 1,
      duration: 500,
      delay: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // strokeDashoffset isn't supported by the native driver
    }).start();
  }, [checkProgress]);

  const strokeDashoffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
              <AnimatedPath
                d="M10 20 L17 27 L30 14"
                stroke={Colors.lime}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={50}
                strokeDashoffset={strokeDashoffset}
              />
            </Svg>
          </View>
          <Text style={styles.successTitle}>Trip complete!</Text>
          <Text style={styles.successSub}>
            {req.pickup} → {req.drop}
          </Text>
        </View>

        <View style={styles.body}>
          <Card style={styles.netCard} pad={20}>
            <View style={styles.netRow}>
              <View>
                <Text style={styles.netEyebrow}>Your net earning</Text>
                <Text style={styles.netValue}>₹{net}</Text>
              </View>
              <View style={styles.netIconWrap}>
                <CashIcon size={26} color={Colors.lime} strokeWidth={1.8} />
              </View>
            </View>
            <View style={styles.netMetaRow}>
              <Text style={styles.netMetaText}>{req.tripDist}</Text>
              <Text style={styles.netMetaText}>·</Text>
              <Text style={styles.netMetaText}>{req.duration}</Text>
              <Text style={styles.netMetaText}>·</Text>
              <Text style={styles.netMetaText}>{req.payment}</Text>
            </View>
          </Card>

          <Card style={styles.breakdownCard} pad={16}>
            <Text style={styles.breakdownLabel}>Fare breakdown</Text>
            {[
              ['Base fare', `₹${base}`, Colors.ink2],
              ['Distance fare', `₹${dist}`, Colors.ink2],
              ['Time fare', `₹${time}`, Colors.ink2],
              ['Surge bonus', '₹0', Colors.ink2],
            ].map(([k, v, c]) => (
              <View key={k} style={styles.breakdownRow}>
                <Text style={[styles.breakdownKey, { color: c as string }]}>
                  {k}
                </Text>
                <Text style={[styles.breakdownValue, { color: c as string }]}>
                  {v}
                </Text>
              </View>
            ))}
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownKey, { color: Colors.red }]}>
                Platform fee (8%)
              </Text>
              <Text style={[styles.breakdownValue, { color: Colors.red }]}>
                −₹{platform}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownKey, { color: Colors.mute }]}>
                TDS (1%)
              </Text>
              <Text style={[styles.breakdownValue, { color: Colors.mute }]}>
                −₹{tds}
              </Text>
            </View>
            <View style={styles.breakdownTotal}>
              <Text style={styles.breakdownTotalLabel}>Net earning</Text>
              <Text style={styles.breakdownTotalValue}>₹{net}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.tripLogButton}>
          <ActivityIcon size={18} color={Colors.ink} strokeWidth={1.8} />
          <Text style={styles.tripLogLabel}>Trip log</Text>
        </TouchableOpacity>
        <PrimaryButton
          label="Rate Passenger"
          onPress={() => navigation.navigate('PassengerRating')}
          icon="none"
          style={styles.rateButton}
        />
      </View>
    </View>
  );
};

export default TripEarningsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vscale(20),
  },
  successHeader: {
    height: vscale(200),
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: hscale(80),
    height: hscale(80),
    borderRadius: hscale(40),
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 10,
  },
  successTitle: {
    marginTop: vscale(12),
    fontSize: fscale(22),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: fscale(13),
    color: 'rgba(15,17,21,0.6)',
    marginTop: vscale(2),
  },
  body: {
    paddingHorizontal: hscale(18),
    paddingTop: vscale(20),
  },
  netCard: {
    backgroundColor: Colors.ink,
    borderColor: 'transparent',
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netEyebrow: {
    fontSize: fscale(11),
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  netValue: {
    fontSize: fscale(40),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    marginTop: vscale(2),
  },
  netIconWrap: {
    width: hscale(56),
    height: hscale(56),
    borderRadius: hscale(28),
    backgroundColor: 'rgba(200,242,96,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netMetaRow: {
    flexDirection: 'row',
    gap: hscale(12),
    marginTop: vscale(12),
  },
  netMetaText: {
    fontSize: fscale(12),
    color: 'rgba(255,255,255,0.5)',
  },
  breakdownCard: {
    marginTop: vscale(12),
  },
  breakdownLabel: {
    fontSize: fscale(11),
    color: Colors.mute,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: vscale(8),
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vscale(6),
  },
  breakdownKey: {
    fontSize: fscale(13.5),
  },
  breakdownValue: {
    fontSize: fscale(13.5),
    fontWeight: '600',
  },
  breakdownTotal: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
    marginTop: vscale(8),
    paddingTop: vscale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownTotalLabel: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
  },
  breakdownTotalValue: {
    fontSize: fscale(18),
    fontWeight: '800',
    color: Colors.green,
    letterSpacing: -0.4,
  },
  footer: {
    flexDirection: 'row',
    gap: hscale(8),
    paddingHorizontal: hscale(18),
    paddingTop: vscale(12),
    paddingBottom: vscale(30),
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  tripLogButton: {
    width: hscale(90),
    height: hscale(56),
    borderRadius: hscale(18),
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 0.5,
    borderColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(6),
  },
  tripLogLabel: {
    fontSize: fscale(13),
    fontWeight: '600',
    color: Colors.ink,
  },
  rateButton: {
    flex: 1,
  },
});
