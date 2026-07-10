import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const CarIcon: React.FC<Props> = ({
  size = 22,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 15L4.5 9.5C4.8 8.3 5.9 7.5 7.1 7.5H16.9C18.1 7.5 19.2 8.3 19.5 9.5L21 15"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 15H21V17.5C21 18.05 20.55 18.5 20 18.5H19C18.45 18.5 18 18.05 18 17.5V16H6V17.5C6 18.05 5.55 18.5 5 18.5H4C3.45 18.5 3 18.05 3 17.5V15Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle cx="7" cy="15" r="0.9" fill={color} />
    <Circle cx="17" cy="15" r="0.9" fill={color} />
  </Svg>
);

export default CarIcon;
