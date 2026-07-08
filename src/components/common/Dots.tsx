import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale } from '../../theme/scale';

// Mirrors the onboarding step-dots exactly:
// { width: i===step ? 24 : 6, height: 6, borderRadius: 3, background: i===step ? T.ink : 'rgba(15,17,21,0.18)' }

interface Props {
  total: number;
  activeIndex: number;
}

const Dots: React.FC<Props> = ({ total, activeIndex }) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { width: hscale(index === activeIndex ? 24 : 6) },
            {
              backgroundColor:
                index === activeIndex ? Colors.ink : Colors.dotInactive,
            },
          ]}
        />
      ))}
    </View>
  );
};

export default Dots;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
  },
  dot: {
    height: hscale(6),
    borderRadius: hscale(3),
  },
});
