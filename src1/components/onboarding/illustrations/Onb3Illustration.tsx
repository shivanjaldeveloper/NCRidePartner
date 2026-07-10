import React from 'react';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

const barHeights = [38, 52, 42, 60, 48, 36, 24];

const Onb3Illustration: React.FC = () => (
  <Svg viewBox="0 0 260 260" width="100%" height="100%">
    <Defs>
      <RadialGradient id="ponb3bg">
        <Stop offset="0" stopColor="#1F9D6B" stopOpacity="0.2" />
        <Stop offset="1" stopColor="#1F9D6B" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="130" cy="130" r="120" fill="url(#ponb3bg)" />

    <Rect x="42" y="80" width="176" height="120" rx="18" fill="#0F1115" />
    <SvgText
      x="58"
      y="112"
      fontSize="11"
      fontWeight="700"
      fill="rgba(255,255,255,0.5)"
    >
      TODAY'S EARNINGS
    </SvgText>
    <SvgText x="58" y="144" fontSize="34" fontWeight="800" fill="#fff">
      ₹2,840
    </SvgText>
    <SvgText x="58" y="164" fontSize="12" fontWeight="600" fill="#fff">
      14 trips............4h 35m online
    </SvgText>

    {/* Bar chart */}
    {barHeights.map((h, i) => (
      <Rect
        key={i}
        x={58 + i * 22}
        y={200 - h}
        width="14"
        height={h}
        rx="4"
        fill={i === 3 ? '#C8F260' : 'rgba(255,255,255,0.2)'}
      />
    ))}

    {/* Payout chip */}
    <Rect
      x="150"
      y="95"
      width="60"
      height="26"
      rx="10"
      fill="rgba(200,242,96,0.15)"
    />
    <SvgText
      x="180"
      y="112"
      textAnchor="middle"
      fontSize="9"
      fontWeight="800"
      fill="#C8F260"
    >
      MON PAYOUT
    </SvgText>
  </Svg>
);

export default Onb3Illustration;
