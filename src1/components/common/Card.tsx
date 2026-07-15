import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale } from '../../theme/scale';

interface Props {
  children: React.ReactNode;
  pad?: number;
  style?: ViewStyle;
}

// Generic rounded white card wrapper used to group list rows
// (document status list, trip history, etc).
const Card: React.FC<Props> = ({ children, pad = 0, style }) => {
  return (
    <View style={[styles.card, { padding: hscale(pad) }, style]}>
      {children}
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: hscale(20),
    borderWidth: 0.5,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
});
