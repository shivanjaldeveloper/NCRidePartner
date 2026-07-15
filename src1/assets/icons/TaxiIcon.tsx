import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const TaxiIcon: React.FC<Props> = ({
  size = 17,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 16V11L6 6H18L20 11V16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 16H20V18.5C20 19.05 19.55 19.5 19 19.5H18C17.45 19.5 17 19.05 17 18.5V17H7V18.5C7 19.05 6.55 19.5 6 19.5H5C4.45 19.5 4 19.05 4 18.5V16Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle cx="7.5" cy="13" r="1.1" fill={color} />
    <Circle cx="16.5" cy="13" r="1.1" fill={color} />
  </Svg>
);

export default TaxiIcon;
