import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale, fscale } from '../../theme/scale';
import StarFillIcon from '../../assets/icons/StarFillIcon';

interface Props {
  value: number;
  size?: number;
  textColor?: string;
}

const RatingStars: React.FC<Props> = ({
  value,
  size = 13,
  textColor = Colors.ink,
}) => (
  <View style={styles.row}>
    <StarFillIcon size={size} color={Colors.amber} />
    <Text
      style={[styles.value, { color: textColor, fontSize: fscale(size - 2) }]}
    >
      {value}
    </Text>
  </View>
);

export default RatingStars;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(4),
  },
  value: {
    fontWeight: '700',
  },
});
