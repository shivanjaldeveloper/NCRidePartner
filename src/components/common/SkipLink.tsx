import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';

interface Props {
  onPress: () => void;
  style?: ViewStyle;
}

const SkipLink: React.FC<Props> = ({ onPress, style }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      onPress={onPress}
      style={style}
    >
      <Text style={[Typography.skipLabel, styles.text]}>
        {t('common.skip')}
      </Text>
    </TouchableOpacity>
  );
};

export default SkipLink;

const styles = StyleSheet.create({
  text: {
    color: Colors.mute,
  },
});
