import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const CameraIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8.5C4 7.67 4.67 7 5.5 7H8L9.2 5.2C9.4 4.9 9.73 4.7 10.1 4.7H13.9C14.27 4.7 14.6 4.9 14.8 5.2L16 7H18.5C19.33 7 20 7.67 20 8.5V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V8.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="13"
      r="3.4"
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export default CameraIcon;
