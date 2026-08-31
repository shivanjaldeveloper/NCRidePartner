import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import PrimaryButton from '../../components/common/PrimaryButton';
import StarFillIcon from '../../assets/icons/StarFillIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { getCookie } from '../../utils/session';
import { submitRatingByPartner } from '../../services/api/ridesService';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'PassengerRating'>;
type ScreenRoute = RouteProp<RootStackParamList, 'PassengerRating'>;

// key is the stable identity used for selection state; labelKey resolves
// through the active language at render time.
const TAGS = [
  { key: 'polite', labelKey: 'passengerRating.tags.polite' },
  { key: 'onTime', labelKey: 'passengerRating.tags.onTime' },
  { key: 'cleanPickupArea', labelKey: 'passengerRating.tags.cleanPickupArea' },
  { key: 'safeRide', labelKey: 'passengerRating.tags.safeRide' },
  { key: 'easyToFind', labelKey: 'passengerRating.tags.easyToFind' },
];

const PassengerRatingScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const { t } = useTranslation();
  const req = PARTNER_RIDE_REQUEST;
  const ride = route.params?.ride;

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

  const handleDone = () => navigation.navigate('MainTabs');

  // Only "Skip" or "Submit" below should move on from here — never the
  // Android hardware back button, which would otherwise drop the partner
  // back onto the (already-completed) earnings screen mid-rating.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!ride?.RideTran) {
      // No ride context to rate against (e.g. screen opened without one) —
      // don't block the partner from moving on.
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
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {req.passengerName
              .split(' ')
              .map(w => w[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>
        <Text style={styles.title}>Rate {req.passengerName}</Text>
        <Text style={styles.subtitle}>How was this passenger?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity
              key={i}
              onPress={() => setRating(i)}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <StarFillIcon
                size={40}
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
                  style={[styles.tagText, selected && styles.tagTextSelected]}
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

        <View style={styles.actionsRow}>
          <PrimaryButton
            label={t('common.skip')}
            onPress={handleDone}
            icon="none"
            variant="ghost"
            style={styles.actionButton}
            disabled={submitting}
          />
          <PrimaryButton
            label={
              submitting
                ? t('passengerRating.submitting')
                : t('passengerRating.submit')
            }
            onPress={handleSubmit}
            icon="none"
            style={styles.actionButton}
            disabled={submitting}
          />
        </View>
      </View>
    </View>
  );
};

export default PassengerRatingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hscale(24),
  },
  content: {
    alignItems: 'center',
  },
  avatar: {
    width: hscale(80),
    height: hscale(80),
    borderRadius: hscale(40),
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: fscale(24),
  },
  title: {
    fontSize: fscale(22),
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.5,
    marginTop: vscale(16),
  },
  subtitle: {
    fontSize: fscale(13.5),
    color: Colors.mute,
    marginTop: vscale(4),
  },
  starsRow: {
    flexDirection: 'row',
    gap: hscale(6),
    marginTop: vscale(20),
    justifyContent: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: hscale(8),
    marginTop: vscale(16),
    justifyContent: 'center',
  },
  tagChip: {
    paddingVertical: vscale(7),
    paddingHorizontal: hscale(12),
    borderRadius: 99,
    backgroundColor: Colors.surface,
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
    minHeight: vscale(72),
    marginTop: vscale(16),
    paddingHorizontal: hscale(14),
    paddingVertical: vscale(10),
    borderRadius: hscale(14),
    borderWidth: 0.5,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    fontSize: fscale(13.5),
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: hscale(8),
    marginTop: vscale(24),
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
});
