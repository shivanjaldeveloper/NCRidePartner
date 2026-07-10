import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const WalletIcon: React.FC<Props> = ({
  size = 20,
  color = '#C8F260',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 7.5C3 6.4 3.9 5.5 5 5.5H17C18.1 5.5 19 6.4 19 7.5V17C19 18.1 18.1 19 17 19H5C3.9 19 3 18.1 3 17V7.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M15 12.5H21V15.5H15C14.2 15.5 13.5 14.8 13.5 14C13.5 13.2 14.2 12.5 15 12.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle cx="15.2" cy="14" r="0.8" fill={color} />
  </Svg>
);

export default WalletIcon;
