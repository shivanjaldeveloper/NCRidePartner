import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { Colors } from '../../../constants/Colors';

// Decorative top-down "map" background. Static SVG rather than a live map —
// this screen only needs to *suggest* location context behind the pulsing
// pin, so we avoid pulling in react-native-maps just for a backdrop.
const PermissionMapIllustration: React.FC = () => (
  <Svg
    viewBox="0 0 400 220"
    width="100%"
    height="100%"
    preserveAspectRatio="xMidYMid slice"
  >
    <Rect x="0" y="0" width="400" height="220" fill={Colors.map} />

    {/* Water */}
    <Path
      d="M-20 30 Q 90 0 180 40 Q 240 65 300 30 L 300 -20 L -20 -20 Z"
      fill={Colors.mapWater}
    />

    {/* Park / green patches */}
    <Circle cx="70" cy="150" r="55" fill={Colors.mapGreen} />
    <Circle cx="345" cy="185" r="40" fill={Colors.mapGreen} />

    {/* Land blocks */}
    <Rect x="150" y="90" width="70" height="50" rx="4" fill={Colors.mapLand} />
    <Rect x="240" y="110" width="55" height="40" rx="4" fill={Colors.mapLand} />
    <Rect x="30" y="60" width="60" height="42" rx="4" fill={Colors.mapLand} />

    {/* Major roads */}
    <Path
      d="M0 120 Q 140 95 220 130 Q 300 160 400 120"
      stroke={Colors.mapRoad}
      strokeWidth="10"
      fill="none"
    />
    <Path
      d="M120 0 Q 150 90 130 220"
      stroke={Colors.mapRoad}
      strokeWidth="8"
      fill="none"
    />

    {/* Minor roads */}
    <Path
      d="M0 170 L 400 190"
      stroke={Colors.mapRoadMinor}
      strokeWidth="4"
      fill="none"
    />
    <Path
      d="M260 0 L 300 220"
      stroke={Colors.mapRoadMinor}
      strokeWidth="4"
      fill="none"
    />
  </Svg>
);

export default PermissionMapIllustration;
