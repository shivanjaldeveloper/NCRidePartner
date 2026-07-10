import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { hscale, vscale } from '../../theme/scale';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Mirrors the design source's <Sheet> wrapper: white panel pinned to the
// bottom of a map screen with rounded top corners and a drag-handle notch.
const BottomSheetPanel: React.FC<Props> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.sheet,
        { paddingBottom: vscale(20) + insets.bottom },
        style,
      ]}
    >
      <View style={styles.handle} />
      {children}
    </View>
  );
};

export default BottomSheetPanel;

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: hscale(28),
    borderTopRightRadius: hscale(28),
    paddingTop: vscale(12),
    paddingHorizontal: hscale(18),
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: hscale(36),
    height: vscale(4),
    borderRadius: 2,
    backgroundColor: Colors.line,
    marginBottom: vscale(14),
  },
});
