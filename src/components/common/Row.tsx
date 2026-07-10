import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import ChevronRightIcon from '../../assets/icons/ChevronRightIcon';

interface Props {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
  showDivider?: boolean;
  showChevron?: boolean;
}

const Row: React.FC<Props> = ({
  icon,
  title,
  sub,
  onPress,
  danger = false,
  showDivider = false,
  showChevron = true,
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
    disabled={!onPress}
    style={[styles.row, showDivider && styles.divider]}
  >
    <View style={styles.iconWrap}>{icon}</View>
    <View style={styles.textWrap}>
      <Text style={[styles.title, danger && styles.dangerText]}>{title}</Text>
      {!!sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
    {showChevron && (
      <ChevronRightIcon size={16} color={Colors.mute2} strokeWidth={2} />
    )}
  </TouchableOpacity>
);

export default Row;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
    padding: hscale(13),
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.line2,
  },
  iconWrap: {
    width: hscale(40),
    height: hscale(40),
    borderRadius: hscale(12),
    backgroundColor: 'rgba(15,17,21,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: fscale(13.5),
    fontWeight: '600',
    color: Colors.ink,
  },
  dangerText: {
    color: Colors.red,
  },
  sub: {
    fontSize: fscale(11.5),
    color: Colors.mute,
    marginTop: vscale(1),
  },
});
