import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import PrimaryButton from '../../components/common/PrimaryButton';
import StarFillIcon from '../../assets/icons/StarFillIcon';
import { PARTNER_RIDE_REQUEST } from '../Home/mockHomeData';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'PassengerRating'>;

const TAGS = [
  'Polite',
  'On time',
  'Clean pickup area',
  'Safe ride',
  'Easy to find',
];

const PassengerRatingScreen = () => {
  const navigation = useNavigation<NavProp>();
  const req = PARTNER_RIDE_REQUEST;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const handleDone = () => navigation.navigate('Home');

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
            const selected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tagChip, selected && styles.tagChipSelected]}
              >
                <Text
                  style={[styles.tagText, selected && styles.tagTextSelected]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton
            label="Skip"
            onPress={handleDone}
            icon="none"
            variant="ghost"
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Submit rating"
            onPress={handleDone}
            icon="none"
            style={styles.actionButton}
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
