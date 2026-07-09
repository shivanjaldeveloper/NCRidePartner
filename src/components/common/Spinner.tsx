import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  size?: number;
  trackColor?: string;
  color?: string;
}

const Spinner: React.FC<Props> = ({
  size = 22,
  trackColor = 'rgba(255,255,255,0.15)',
  color = '#C8F260',
}) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Circle
          cx="25"
          cy="25"
          r="20"
          stroke={trackColor}
          strokeWidth="3"
          fill="none"
        />
        <Circle
          cx="25"
          cy="25"
          r="20"
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 20 * 0.25}, ${2 * Math.PI * 20}`}
        />
      </Svg>
    </Animated.View>
  );
};

export default Spinner;
