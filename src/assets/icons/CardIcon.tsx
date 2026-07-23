import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const CardIcon: React.FC<Props> = ({
  size = 17,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2.5"
      y="5.5"
      width="19"
      height="13"
      rx="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1="2.5"
      y1="10"
      x2="21.5"
      y2="10"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1="5.5"
      y1="14.5"
      x2="10"
      y2="14.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export default CardIcon;
