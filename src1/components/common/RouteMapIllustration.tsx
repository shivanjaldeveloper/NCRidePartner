import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface Props {
  height?: number;
}

// Static top-down "map" backdrop with a route line and vehicle marker.
// Same rationale as PermissionMapIllustration — this is a decorative
// backdrop, not a live map, so we don't need react-native-maps for it.
// Fills whatever parent container sizes/positions it (the ride-flow
// screens each wrap this in their own absolutely-positioned map area).
const RouteMapIllustration: React.FC<Props> = () => (
  <View style={styles.wrap}>
    <Svg
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
    >
      <Rect x="0" y="0" width="400" height="400" fill={Colors.map} />
      <Circle cx="60" cy="320" r="70" fill={Colors.mapGreen} />
      <Circle cx="340" cy="70" r="60" fill={Colors.mapGreen} />
      <Rect
        x="200"
        y="180"
        width="90"
        height="70"
        rx="4"
        fill={Colors.mapLand}
      />
      <Rect
        x="40"
        y="120"
        width="70"
        height="55"
        rx="4"
        fill={Colors.mapLand}
      />

      {/* Route */}
      <Path
        d="M90 330 Q 160 260 180 200 Q 210 130 300 90"
        stroke={Colors.mapRoad}
        strokeWidth="14"
        fill="none"
      />
      <Path
        d="M90 330 Q 160 260 180 200 Q 210 130 300 90"
        stroke={Colors.blue}
        strokeWidth="3"
        strokeDasharray="8 8"
        fill="none"
      />

      {/* Minor roads */}
      <Path
        d="M0 250 L 400 270"
        stroke={Colors.mapRoadMinor}
        strokeWidth="4"
        fill="none"
      />
      <Path
        d="M250 0 L 280 400"
        stroke={Colors.mapRoadMinor}
        strokeWidth="4"
        fill="none"
      />

      {/* Pickup marker (start of route) */}
      <Circle
        cx="90"
        cy="330"
        r="9"
        fill={Colors.green}
        stroke="#FFFFFF"
        strokeWidth="3"
      />
      {/* Vehicle marker (mid route) */}
      <Circle
        cx="180"
        cy="200"
        r="10"
        fill={Colors.lime}
        stroke={Colors.ink}
        strokeWidth="3"
      />
      {/* Drop marker (end of route) */}
      <Rect
        x="293"
        y="83"
        width="14"
        height="14"
        rx="3"
        fill={Colors.ink}
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </Svg>
  </View>
);

export default RouteMapIllustration;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
  },
});
