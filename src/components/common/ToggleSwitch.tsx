import React, { useEffect, useRef } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale } from '../../theme/scale';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;

const ToggleSwitch: React.FC<Props> = ({ value, onChange }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false, // animating backgroundColor/left, not transform-only
    }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(15,17,21,0.15)', Colors.ink],
  });
  const thumbLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [hscale(2), hscale(TRACK_WIDTH - THUMB_SIZE - 2)],
  });

  return (
    <TouchableWithoutFeedback onPress={() => onChange(!value)}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.thumb, { left: thumbLeft }]} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ToggleSwitch;

const styles = StyleSheet.create({
  track: {
    width: hscale(TRACK_WIDTH),
    height: hscale(TRACK_HEIGHT),
    borderRadius: hscale(TRACK_HEIGHT / 2),
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: hscale(2),
    width: hscale(THUMB_SIZE),
    height: hscale(THUMB_SIZE),
    borderRadius: hscale(THUMB_SIZE / 2),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
});
