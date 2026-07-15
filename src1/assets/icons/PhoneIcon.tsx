import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const PhoneIcon: React.FC<Props> = ({
  size = 20,
  color = '#C8F260',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7.5 3.5L10 6.5L8 9C8.8 10.9 10.6 12.7 12.5 13.5L15 11.5L18 14V17.5C18 18.6 17.1 19.5 16 19.5C9.7 19.2 4.8 14.3 4.5 8C4.5 6.9 5.4 6 6.5 6L7.5 3.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default PhoneIcon;
