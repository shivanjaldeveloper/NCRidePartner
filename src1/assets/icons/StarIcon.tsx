import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const StarIcon: React.FC<Props> = ({
  size = 17,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L14.6 9L21 9.7L16.3 14L17.6 20.3L12 17.1L6.4 20.3L7.7 14L3 9.7L9.4 9L12 3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);

export default StarIcon;
