import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const EditIcon: React.FC<Props> = ({
  size = 17,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 20L4.7 16.9L15.4 6.2C15.8 5.8 16.4 5.8 16.8 6.2L18.3 7.7C18.7 8.1 18.7 8.7 18.3 9.1L7.6 19.8L4 20Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.5 8.1L16.4 11"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export default EditIcon;
