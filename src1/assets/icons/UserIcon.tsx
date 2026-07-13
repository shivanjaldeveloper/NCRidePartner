import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const UserIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M5 20C5.7 16.7 8.5 14.5 12 14.5C15.5 14.5 18.3 16.7 19 20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export default UserIcon;
