import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import type { ManeuverType } from '../../utils/routing';

interface Props {
  maneuver: ManeuverType;
  size?: number;
  color?: string;
}

// One base "up arrow" glyph, rotated per maneuver — same trick real nav
// apps use rather than drawing a bespoke icon per turn type. Special
// cases (u-turn, roundabout, merge, fork, arrive/depart) get their own
// path since a rotated straight arrow can't represent them.
const ROTATION_BY_MANEUVER: Record<string, number> = {
  straight: 0,
  'turn-slight-right': 30,
  'turn-right': 90,
  'turn-sharp-right': 135,
  'turn-sharp-left': -135,
  'turn-left': -90,
  'turn-slight-left': -30,
  'ramp-right': 45,
  'ramp-left': -45,
  'roundabout-right': 90,
  'roundabout-left': -90,
};

const ManeuverArrowIcon: React.FC<Props> = ({
  maneuver,
  size = 26,
  color = '#FFFFFF',
}) => {
  if (maneuver === 'arrive') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={2} />
        <Circle cx="12" cy="12" r="2.5" fill={color} />
      </Svg>
    );
  }

  if (maneuver === 'depart') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="17" r="2.5" fill={color} />
        <Path
          d="M12 14V4"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d="M7 8L12 3L17 8"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (maneuver === 'uturn-left' || maneuver === 'uturn-right') {
    const mirror = maneuver === 'uturn-right' ? -1 : 1;
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 20V11C9 7.5 11.5 5 15 5C18 5 20 7 20 10"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          transform={mirror === -1 ? 'scale(-1,1) translate(-24,0)' : undefined}
        />
        <Path
          d="M16.5 6L20.3 9.8L16.7 12.6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={mirror === -1 ? 'scale(-1,1) translate(-24,0)' : undefined}
        />
        <Path
          d="M9 20L5 16"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          transform={mirror === -1 ? 'scale(-1,1) translate(-24,0)' : undefined}
        />
      </Svg>
    );
  }

  if (maneuver === 'merge' || maneuver.startsWith('fork')) {
    const mirror = maneuver.endsWith('left') ? -1 : 1;
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 21V13C12 13 12 8 17 6"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          transform={mirror === -1 ? 'scale(-1,1) translate(-24,0)' : undefined}
        />
        <Path
          d="M12 13C12 13 12 8 7 6"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.5}
          transform={mirror === -1 ? 'scale(-1,1) translate(-24,0)' : undefined}
        />
        <Path
          d="M13.5 3.5L18 6L14.5 9"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={mirror === -1 ? 'scale(-1,1) translate(-24,0)' : undefined}
        />
      </Svg>
    );
  }

  const rotation = ROTATION_BY_MANEUVER[maneuver] ?? 0;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: `${rotation}deg` }] }}
    >
      <Path
        d="M12 20V5"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Path
        d="M6 10L12 4L18 10"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ManeuverArrowIcon;
