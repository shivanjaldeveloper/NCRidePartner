import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const SettingsIcon: React.FC<Props> = ({
  size = 18,
  color = '#0F1115',
  strokeWidth = 1.8,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M19.4 13.5C19.5 13 19.5 12.5 19.4 12L21 10.5L19.5 8L17.5 8.5C17.1 8.1 16.6 7.8 16 7.5L15.5 5.5H12.5L12 7.5C11.4 7.8 10.9 8.1 10.5 8.5L8.5 8L7 10.5L8.6 12C8.5 12.5 8.5 13 8.6 13.5L7 15L8.5 17.5L10.5 17C10.9 17.4 11.4 17.7 12 18L12.5 20H15.5L16 18C16.6 17.7 17.1 17.4 17.5 17L19.5 17.5L21 15L19.4 13.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);

export default SettingsIcon;
