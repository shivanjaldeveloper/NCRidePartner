import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { hscale } from '../../theme/scale';
import ArrowRightIcon from '../../assets/icons/ArrowRightIcon';
import CheckIcon from '../../assets/icons/CheckIcon';

// Mirrors Btn({ variant: 'primary', size: 'lg' }) from the design source exactly:
// sizes.lg = { h: 56, px: 22, fs: 16, r: 18 }
// variants.primary = { bg: T.ink, color: '#fff', shadow: '0 4px 14px rgba(15,17,21,0.18)' }

interface Props {
  label: string;
  onPress: () => void;
  icon?: 'arrowRight' | 'check' | 'none';
  style?: ViewStyle;
  disabled?: boolean;
}

const PrimaryButton: React.FC<Props> = ({
  label,
  onPress,
  icon = 'arrowRight',
  style,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
    >
      <Text style={[Typography.buttonLabel, { color: '#FFFFFF' }]}>
        {label}
      </Text>
      {icon === 'arrowRight' && (
        <ArrowRightIcon size={18} color="#FFFFFF" strokeWidth={1.8} />
      )}
      {icon === 'check' && (
        <CheckIcon size={18} color="#FFFFFF" strokeWidth={1.8} />
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    height: hscale(56),
    paddingHorizontal: hscale(22),
    borderRadius: hscale(18),
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hscale(8),
    shadowColor: '#0F1115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
