import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const RewardIcon: React.FC<Props> = ({
  size = 16,
  color = '#C8F260',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="9" r="5.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M8.5 13.5L7 21L12 18.5L17 21L15.5 13.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default RewardIcon;
