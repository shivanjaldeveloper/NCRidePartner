import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

// Exact translation of the splash-screen steering wheel icon from the design source
const WheelLogoIcon: React.FC<Props> = ({ size = 64, color = '#C8F260' }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Circle cx="32" cy="32" r="26" stroke={color} strokeWidth="4" />
    <Circle cx="32" cy="32" r="8" fill={color} />
    <Line
      x1="32"
      y1="6"
      x2="32"
      y2="24"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Line
      x1="32"
      y1="40"
      x2="32"
      y2="58"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Line
      x1="8.6"
      y1="19"
      x2="24.2"
      y2="27"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Line
      x1="39.8"
      y1="37"
      x2="55.4"
      y2="45"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Line
      x1="55.4"
      y1="19"
      x2="39.8"
      y2="27"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Line
      x1="24.2"
      y1="37"
      x2="8.6"
      y2="45"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

export default WheelLogoIcon;
