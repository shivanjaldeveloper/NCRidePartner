import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

interface Props {
  backgroundColor?: string;
  style?: ViewStyle;
}

const TopSafeStrap: React.FC<Props> = ({
  backgroundColor = Colors.background,
  style,
}) => {
  const insets = useSafeAreaInsets();
  return <View style={[{ height: insets.top, backgroundColor }, style]} />;
};

export default TopSafeStrap;

const styles = StyleSheet.create({});
