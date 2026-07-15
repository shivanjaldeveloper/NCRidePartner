import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const CashIcon: React.FC<Props> = ({
  size = 17,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="6"
      width="20"
      height="12"
      rx="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

export default CashIcon;
