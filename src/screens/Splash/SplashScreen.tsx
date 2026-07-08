import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { hscale, vscale } from '../../theme/scale';
import WheelLogoIcon from '../../assets/icons/WheelLogoIcon';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const LOGO_SIZE = 110;

// Builds a circle View, centered on (centerX, centerY), regardless of its own size —
// stacking several of these with the same center + increasing opacity/decreasing
// size fakes a soft blurred glow without needing an actual blur filter.
const ring = (
  size: number,
  color: string,
  centerY: number,
  centerX: number,
) => ({
  width: hscale(size),
  height: hscale(size),
  borderRadius: hscale(size / 2),
  backgroundColor: color,
  top: centerY - hscale(size) / 2,
  left: centerX - hscale(size) / 2,
});

const SplashScreen = () => {
  const navigation = useNavigation<NavProp>();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Onboarding1'), 2200);
    return () => clearTimeout(t);
  }, [navigation]);

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
    <View style={styles.container}>
      {/* Ambient glow — layered concentric circles fake a soft blur falloff
          (plain Views, no SVG, no blur library needed). Each ring is
          centered on the same anchor point regardless of its own size. */}
      <View
        style={[
          styles.glowRing,
          ring(460, 'rgba(200,242,96,0.06)', hscale(140), hscale(150)),
        ]}
      />
      <View
        style={[
          styles.glowRing,
          ring(340, 'rgba(200,242,96,0.09)', hscale(140), hscale(150)),
        ]}
      />
      <View
        style={[
          styles.glowRing,
          ring(220, 'rgba(200,242,96,0.12)', hscale(140), hscale(150)),
        ]}
      />

      <View
        style={[
          styles.glowRing,
          ring(420, 'rgba(31,157,107,0.05)', hscale(560), hscale(500)),
        ]}
      />
      <View
        style={[
          styles.glowRing,
          ring(300, 'rgba(31,157,107,0.08)', hscale(560), hscale(500)),
        ]}
      />
      <View
        style={[
          styles.glowRing,
          ring(180, 'rgba(31,157,107,0.1)', hscale(560), hscale(500)),
        ]}
      />

      <View style={styles.content}>
        {/* Logo box — flat tinted background instead of an SVG gradient,
            small bounded WheelLogoIcon on top (same pattern as icons
            already working fine inside your buttons/illustrations). */}
        <View style={styles.logoBox}>
          <WheelLogoIcon size={hscale(64)} color="#C8F260" />
        </View>

        <Text style={styles.title}>NCRide Partner</Text>
        <Text style={styles.subtitle}>
          Drive · Earn · Grow across Delhi NCR
        </Text>
      </View>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Svg width={hscale(28)} height={hscale(28)} viewBox="0 0 50 50">
            <Circle
              cx="25"
              cy="25"
              r="20"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
              fill="none"
            />
            <Circle
              cx="25"
              cy="25"
              r="20"
              stroke="#C8F260"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20 * 0.25}, ${
                2 * Math.PI * 20
              }`}
            />
          </Svg>
        </Animated.View>
        <Text style={styles.footerCaption}>PARTNER · NCR</Text>
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: hscale(LOGO_SIZE),
    height: hscale(LOGO_SIZE),
    borderRadius: hscale(32),
    backgroundColor: '#2A3A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vscale(28),
    elevation: 12,
  },
  title: {
    ...Typography.splashTitle,
  },
  subtitle: {
    ...Typography.splashSubtitle,
    marginTop: vscale(6),
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: vscale(48),
    gap: vscale(12),
  },
  footerCaption: {
    fontSize: hscale(11),
    fontWeight: '500',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.35)',
  },
});
