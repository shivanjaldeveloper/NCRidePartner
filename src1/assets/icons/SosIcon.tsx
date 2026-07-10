import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const SosIcon: React.FC<Props> = ({
  size = 20,
  color = '#E0524E',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Line
      x1="12"
      y1="8"
      x2="12"
      y2="13"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="12"
      y1="16"
      x2="12"
      y2="16.3"
      stroke={color}
      strokeWidth={strokeWidth + 0.4}
      strokeLinecap="round"
    />
  </Svg>
);

export default SosIcon;
