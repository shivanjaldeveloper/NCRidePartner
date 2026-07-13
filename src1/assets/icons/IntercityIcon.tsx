import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const IntercityIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="19" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M7.5 12H16.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray="2.4 2.4"
    />
  </Svg>
);

export default IntercityIcon;
