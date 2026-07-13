import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const AccountIcon: React.FC<Props> = ({
  size = 22,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M4.5 20C5.3 16.5 8.3 14 12 14C15.7 14 18.7 16.5 19.5 20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export default AccountIcon;
