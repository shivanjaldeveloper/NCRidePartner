import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const InvoiceIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="5"
      y="3"
      width="14"
      height="18"
      rx="2"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Line
      x1="8"
      y1="8"
      x2="16"
      y2="8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="8"
      y1="12"
      x2="16"
      y2="12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Line
      x1="8"
      y1="16"
      x2="13"
      y2="16"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export default InvoiceIcon;
