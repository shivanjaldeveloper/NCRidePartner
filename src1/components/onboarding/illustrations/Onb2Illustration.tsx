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

const Onb2Illustration: React.FC = () => (
  <Svg viewBox="0 0 260 260" width="100%" height="100%">
    <Defs>
      <RadialGradient id="ponb2bg">
        <Stop offset="0" stopColor="#2E7DFF" stopOpacity="0.15" />
        <Stop offset="1" stopColor="#2E7DFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="130" cy="130" r="120" fill="url(#ponb2bg)" />

    {/* Car tile */}
    <G transform="translate(38, 65)">
      <Rect
        width="84"
        height="56"
        rx="14"
        fill="#fff"
        stroke="rgba(15,17,21,0.06)"
        strokeWidth="0.5"
      />
      <Path d="M12 38 L16 22 H52 L56 38V42H12Z" fill="#0F1115" />
      <Rect x="18" y="24" width="30" height="11" rx="2" fill="#9AC8FF" />
      <Circle
        cx="20"
        cy="42"
        r="4"
        fill="#333"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <Circle
        cx="48"
        cy="42"
        r="4"
        fill="#333"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <SvgText x="68" y="36" fontSize="9" fontWeight="700" fill="#0F1115">
        Car
      </SvgText>
    </G>

    {/* Auto tile */}
    <G transform="translate(138, 65)">
      <Rect
        width="84"
        height="56"
        rx="14"
        fill="#fff"
        stroke="rgba(15,17,21,0.06)"
        strokeWidth="0.5"
      />
      <Path d="M12 36 L18 18 H42V36Z" fill="#F2A03D" />
      <Rect
        x="20"
        y="20"
        width="20"
        height="12"
        rx="2"
        fill="#0F1115"
        opacity="0.8"
      />
      <Circle cx="18" cy="40" r="4" fill="#333" />
      <Circle cx="44" cy="40" r="4" fill="#333" />
      <SvgText x="56" y="36" fontSize="9" fontWeight="700" fill="#0F1115">
        Auto
      </SvgText>
    </G>

    {/* Bike tile */}
    <G transform="translate(38, 148)">
      <Rect
        width="84"
        height="56"
        rx="14"
        fill="#fff"
        stroke="rgba(15,17,21,0.06)"
        strokeWidth="0.5"
      />
      <Circle
        cx="18"
        cy="34"
        r="8"
        fill="none"
        stroke="#0F1115"
        strokeWidth="2.5"
      />
      <Circle
        cx="46"
        cy="34"
        r="8"
        fill="none"
        stroke="#0F1115"
        strokeWidth="2.5"
      />
      <Path
        d="M18 34 L28 22 L42 22 L46 34"
        fill="none"
        stroke="#0F1115"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Rect x="28" y="18" width="12" height="5" fill="#2E7DFF" />
      <SvgText x="58" y="37" fontSize="9" fontWeight="700" fill="#0F1115">
        Bike
      </SvgText>
    </G>

    {/* E-Rickshaw tile */}
    <G transform="translate(138, 148)">
      <Rect
        width="84"
        height="56"
        rx="14"
        fill="#fff"
        stroke="rgba(15,17,21,0.06)"
        strokeWidth="0.5"
      />
      <Rect
        x="10"
        y="18"
        width="36"
        height="20"
        rx="5"
        fill="#00C2D7"
        opacity="0.85"
      />
      <Rect
        x="14"
        y="22"
        width="28"
        height="10"
        rx="2"
        fill="rgba(255,255,255,0.5)"
      />
      <Circle
        cx="16"
        cy="40"
        r="4.5"
        fill="#333"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <Circle
        cx="42"
        cy="40"
        r="4.5"
        fill="#333"
        stroke="#fff"
        strokeWidth="1.5"
      />
      <SvgText x="52" y="34" fontSize="8" fontWeight="700" fill="#0F1115">
        E-Rick
      </SvgText>
    </G>
  </Svg>
);

export default Onb2Illustration;
