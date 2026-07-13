import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';

interface Option {
  id: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}

const SegmentedTabs: React.FC<Props> = ({ options, value, onChange }) => (
  <View style={styles.track}>
    {options.map(opt => {
      const active = opt.id === value;
      return (
        <TouchableOpacity
          key={opt.id}
          onPress={() => onChange(opt.id)}
          style={[styles.pill, active && styles.pillActive]}
        >
          <Text style={[styles.label, active && styles.labelActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default SegmentedTabs;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: hscale(4),
    padding: hscale(4),
    backgroundColor: Colors.bg2,
    borderRadius: hscale(14),
  },
  pill: {
    flex: 1,
    paddingVertical: vscale(9),
    borderRadius: hscale(11),
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: fscale(12.5),
    fontWeight: '700',
    color: Colors.mute,
  },
  labelActive: {
    color: Colors.ink,
  },
});
