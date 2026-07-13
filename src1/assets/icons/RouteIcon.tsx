import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const RouteIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="18" cy="18" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M6 8.5V13C6 14.5 7.5 16 9 16H12C13.5 16 15 14.5 15 13V11"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray="2 2.5"
    />
  </Svg>
);

export default RouteIcon;
