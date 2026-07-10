import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import ChevronLeftIcon from '../../assets/icons/ChevronLeftIcon';

interface Props {
  title: string;
  onBack: () => void;
  sub?: string;
}

const HeaderBack: React.FC<Props> = ({ title, onBack, sub }) => (
  <View style={styles.row}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <ChevronLeftIcon size={20} color={Colors.ink} strokeWidth={2} />
    </TouchableOpacity>
    <View style={styles.textWrap}>
      <Text style={styles.title}>{title}</Text>
      {!!sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  </View>
);

export default HeaderBack;

const styles = StyleSheet.create({
  row: {
    paddingTop: vscale(24),
    paddingHorizontal: hscale(18),
    paddingBottom: vscale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(14),
  },
  backButton: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(14),
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: fscale(19),
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: fscale(12),
    color: Colors.mute,
    marginTop: vscale(1),
  },
});
