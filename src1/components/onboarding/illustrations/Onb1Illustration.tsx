import React from 'react';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Path,
  Rect,
  G,
  Text as SvgText,
} from 'react-native-svg';

const Onb1Illustration: React.FC = () => (
  <Svg viewBox="0 0 260 260" width="100%" height="100%">
    <Defs>
      <RadialGradient id="ponb1bg">
        <Stop offset="0" stopColor="#C8F260" stopOpacity="0.35" />
        <Stop offset="1" stopColor="#C8F260" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="130" cy="130" r="120" fill="url(#ponb1bg)" />
    <Circle cx="130" cy="130" r="90" fill="#fff" stroke="rgba(15,17,21,0.06)" />

    {/* Road */}
    <Path
      d="M40 170 Q 130 100 220 140"
      stroke="#EFF2EE"
      strokeWidth="18"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M40 170 Q 130 100 220 140"
      stroke="white"
      strokeWidth="12"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M40 170 Q 130 100 220 140"
      stroke="#2E7DFF"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="6 6"
    />

    {/* Car */}
    <G transform="translate(138, 112)">
      <Rect width="44" height="26" rx="6" fill="#0F1115" />
      <Rect x="4" y="4" width="36" height="12" rx="2" fill="#9AC8FF" />
      <Circle cx="10" cy="26" r="5" fill="#222" />
      <Circle cx="34" cy="26" r="5" fill="#222" />
      <Path d="M44 8 L54 13 L44 18Z" fill="#C8F260" />
    </G>

    {/* Rupee glow */}
    <Circle cx="178" cy="82" r="28" fill="rgba(200,242,96,0.25)" />
    <SvgText
      x="178"
      y="90"
      textAnchor="middle"
      fontSize="26"
      fontWeight="800"
      fill="#0F1115"
    >
      ₹
    </SvgText>
  </Svg>
);

export default Onb1Illustration;
