import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';

interface Props {
  icon: React.ReactNode;
  label: string;
}

const IconCard: React.FC<Props> = ({ icon, label }) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

export default IconCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: hscale(14),
    paddingVertical: vscale(14),
    paddingHorizontal: hscale(14),
    width: hscale(140),
    gap: hscale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: hscale(28),
    height: hscale(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fscale(13),
    fontWeight: '600',
    color: Colors.ink,
  },
});
