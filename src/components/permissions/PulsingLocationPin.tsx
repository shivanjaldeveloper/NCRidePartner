import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { hscale } from '../../theme/scale';

// Mirrors the source's centered pulse dot:
// outer ring: rgba(200,242,96,0.35), animation: aryoPulse 1.8s ease-out infinite
// inner dot: 28x28, background #C8F260, 5px solid #fff border, drop shadow
const PulsingLocationPin: React.FC = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[styles.ring, { transform: [{ scale }], opacity }]}
      />
      <View style={styles.dot} />
    </View>
  );
};

export default PulsingLocationPin;

const RING_SIZE = 68;
const DOT_SIZE = 28;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: hscale(RING_SIZE),
    height: hscale(RING_SIZE),
    borderRadius: hscale(RING_SIZE / 2),
    backgroundColor: 'rgba(200,242,96,0.35)',
  },
  dot: {
    width: hscale(DOT_SIZE),
    height: hscale(DOT_SIZE),
    borderRadius: hscale(DOT_SIZE / 2),
    backgroundColor: Colors.lime,
    borderWidth: hscale(5),
    borderColor: '#FFFFFF',
    shadowColor: Colors.lime,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 6,
  },
});
