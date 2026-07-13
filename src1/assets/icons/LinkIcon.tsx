import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const LinkIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.5 14.5L14.5 9.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M11 7L12.5 5.5C13.9 4.1 16.1 4.1 17.5 5.5C18.9 6.9 18.9 9.1 17.5 10.5L16 12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M13 17L11.5 18.5C10.1 19.9 7.9 19.9 6.5 18.5C5.1 17.1 5.1 14.9 6.5 13.5L8 12"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export default LinkIcon;
