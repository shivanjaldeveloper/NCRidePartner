import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  BackHandler,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import CashIcon from '../../assets/icons/CashIcon';
import StarFillIcon from '../../assets/icons/StarFillIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { getCookie } from '../../utils/session';
import { submitRatingByPartner } from '../../services/api/ridesService';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'TripEarnings'>;
type ScreenRoute = RouteProp<RootStackParamList, 'TripEarnings'>;

const AnimatedPath = Animated.createAnimatedComponent(Path);

// key is the stable identity used for selection state; labelKey resolves
// through the active language at render time.
const TAGS = [
  { key: 'polite', labelKey: 'passengerRating.tags.polite' },
  { key: 'onTime', labelKey: 'passengerRating.tags.onTime' },
  { key: 'cleanPickupArea', labelKey: 'passengerRating.tags.cleanPickupArea' },
  { key: 'safeRide', labelKey: 'passengerRating.tags.safeRide' },
  { key: 'easyToFind', labelKey: 'passengerRating.tags.easyToFind' },
];

const TripEarningsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const req = PARTNER_RIDE_REQUEST;
  const { ride, fare, fareText } = route.params ?? {};

  // CompleteRide's response only ever returns the final total fare
  // (EstimatedFare/EstimatedFareText) — there's no per-component
  // base/distance/time/surge split, no platform fee, and no TDS from the
  // API today, so this screen shows the total fare as-is instead of
  // fabricating a breakdown.
  const earning = Number(fare) || req.earning || 186;
  const totalFareText = fareText || `₹${earning}`;

  // Same fallback pattern as PickupNav/Arrived: GetPendingRides/CompleteRide
  // only send CustomerName when the backend has it, so fall back to a
  // generic label instead of the mock passenger name.
  const passengerName = ride?.CustomerName || t('common.passenger');

  const pickupLabel = ride?.Pickup?.Address || req.pickup;
  const dropLabel = ride?.Drop?.Address || req.drop;
  const distLabel = ride ? `${ride.TripDistanceKM} km` : req.tripDist;
  const durationLabel = ride
    ? `${ride.TripDurationMinutes} minutes`
    : req.duration;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tagKey: string) => {
    setSelectedTags(prev =>
      prev.includes(tagKey)
        ? prev.filter(k => k !== tagKey)
        : [...prev, tagKey],
    );
  };

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

  // No back arrow on this screen and it's reached right after completing a
  // ride — only leave it via the "Done" tap below, never the Android
  // hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const strokeDashoffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const handleDone = () => navigation.navigate('MainTabs');

  const handleSubmit = async () => {
    if (submitting) return;
    if (!ride?.RideTran) {
      // No ride context to rate against — don't block the partner from
      // moving on.
      handleDone();
      return;
    }
    setSubmitting(true);
    try {
      const cookie = await getCookie();
      if (!cookie) throw new Error('Session not found. Please log in again.');
      const res = await submitRatingByPartner(
        cookie,
        ride.RideTran,
        rating,
        comment.trim(),
      );
      if (res.Result !== 'Success') {
        throw new Error(res.Message || 'Could not submit rating.');
      }
      handleDone();
    } catch (err: any) {
      Alert.alert(
        'Could not submit rating',
        err?.message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.successTitle}>
            {t('tripEarnings.tripComplete')}
          </Text>
        </View>

        <View style={styles.body}>
          <Card style={styles.netCard} pad={22}>
            <View style={styles.netRow}>
              <View>
                <Text style={styles.netEyebrow}>
                  {t('tripEarnings.totalFare')}
                </Text>
                <Text style={styles.netValue}>{totalFareText}</Text>
              </View>
              <View style={styles.netIconWrap}>
                <CashIcon size={26} color={Colors.lime} strokeWidth={1.8} />
              </View>
            </View>
            <View style={styles.netMetaRow}>
              <Text style={styles.netMetaText}>{distLabel}</Text>
              <Text style={styles.netMetaText}>·</Text>
              <Text style={styles.netMetaText}>{durationLabel}</Text>
            </View>
          </Card>

          <View style={styles.collectBanner}>
            <CashIcon size={20} color={Colors.ink} strokeWidth={2} />
            <Text style={styles.collectText}>
              {t('tripEarnings.collectFromPassenger', {
                amount: totalFareText,
              })}
            </Text>
          </View>

          <Card style={styles.routeCard} pad={16}>
            <View style={styles.routeRow}>
              <View style={styles.pickupDot} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeLabel}>
                  {t('tripEarnings.pickup')}
                </Text>
                <Text style={styles.routeValue} numberOfLines={1}>
                  {pickupLabel}
                </Text>
              </View>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={styles.dropDot} />
              <View style={styles.routeTextWrap}>
                <Text style={styles.routeLabel}>{t('tripEarnings.drop')}</Text>
                <Text style={styles.routeValue} numberOfLines={1}>
                  {dropLabel}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.ratingCard} pad={18}>
            <Text style={styles.ratingTitle}>Rate {passengerName}</Text>
            <Text style={styles.ratingSubtitle}>How was this passenger?</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <StarFillIcon
                    size={34}
                    color={i <= rating ? Colors.amber : 'rgba(15,17,21,0.15)'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tagsRow}>
              {TAGS.map(tag => {
                const selected = selectedTags.includes(tag.key);
                return (
                  <TouchableOpacity
                    key={tag.key}
                    onPress={() => toggleTag(tag.key)}
                    style={[styles.tagChip, selected && styles.tagChipSelected]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selected && styles.tagTextSelected,
                      ]}
                    >
                      {t(tag.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder={t('passengerRating.commentPlaceholder')}
              placeholderTextColor={Colors.mute}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={300}
            />
          </Card>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: vscale(20) + insets.bottom }]}
      >
        <PrimaryButton
          label={
            submitting
              ? t('passengerRating.submitting')
              : t('tripEarnings.done')
          }
          onPress={handleSubmit}
          icon="none"
          style={styles.doneButton}
          disabled={submitting}
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
    height: vscale(180),
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hscale(24),
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
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: hscale(20),
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
  collectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(10),
    marginTop: vscale(14),
    paddingVertical: vscale(16),
    paddingHorizontal: hscale(18),
    borderRadius: hscale(18),
    backgroundColor: Colors.amber,
  },
  collectText: {
    flex: 1,
    fontSize: fscale(15),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  routeCard: {
    marginTop: vscale(14),
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    paddingVertical: vscale(4),
  },
  pickupDot: {
    width: hscale(10),
    height: hscale(10),
    borderRadius: hscale(5),
    backgroundColor: Colors.green,
    borderWidth: 3,
    borderColor: 'rgba(31,157,107,0.15)',
  },
  dropDot: {
    width: hscale(10),
    height: hscale(10),
    borderRadius: hscale(2),
    backgroundColor: Colors.ink,
  },
  routeConnector: {
    marginLeft: hscale(5),
    width: 0,
    height: vscale(16),
    borderLeftWidth: 2,
    borderLeftColor: Colors.line,
    borderStyle: 'dashed',
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fscale(10),
    color: Colors.mute,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  routeValue: {
    fontSize: fscale(14),
    fontWeight: '700',
    color: Colors.ink,
    marginTop: vscale(2),
  },
  ratingCard: {
    marginTop: vscale(14),
  },
  ratingTitle: {
    fontSize: fscale(17),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  ratingSubtitle: {
    fontSize: fscale(12.5),
    color: Colors.mute,
    marginTop: vscale(2),
  },
  starsRow: {
    flexDirection: 'row',
    gap: hscale(6),
    marginTop: vscale(16),
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hscale(8),
    marginTop: vscale(14),
  },
  tagChip: {
    paddingVertical: vscale(7),
    paddingHorizontal: hscale(12),
    borderRadius: 99,
    backgroundColor: Colors.bg,
    borderWidth: 0.5,
    borderColor: Colors.line,
  },
  tagChipSelected: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tagText: {
    fontSize: fscale(12),
    fontWeight: '600',
    color: Colors.ink,
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  commentInput: {
    width: '100%',
    minHeight: vscale(64),
    marginTop: vscale(14),
    paddingHorizontal: hscale(14),
    paddingVertical: vscale(10),
    borderRadius: hscale(14),
    borderWidth: 0.5,
    borderColor: Colors.line,
    backgroundColor: Colors.bg,
    fontSize: fscale(13.5),
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: hscale(20),
    paddingTop: vscale(12),
    backgroundColor: Colors.bg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  doneButton: {
    width: '100%',
  },
});
