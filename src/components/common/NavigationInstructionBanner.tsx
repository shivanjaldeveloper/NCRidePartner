import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import ManeuverArrowIcon from '../../assets/icons/ManeuverArrowIcon';
import type { ManeuverType } from '../../utils/routing';

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(0, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

interface Props {
  /** Distance (meters) from the driver's current position to this maneuver. */
  distanceMeters: number;
  maneuver: ManeuverType;
  instruction: string;
  nextManeuver?: ManeuverType;
  nextInstruction?: string;
}

// Mirrors the "Turn left / 210m / Then ⟶" banner Google Maps shows during
// turn-by-turn nav, restyled in the app's own dark-ink palette instead of
// Google's teal chrome so it reads as native to NCRide Partner.
const NavigationInstructionBanner: React.FC<Props> = ({
  distanceMeters,
  maneuver,
  instruction,
  nextManeuver,
  nextInstruction,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + vscale(10) }]}>
      <View style={styles.mainRow}>
        <View style={styles.iconBadge}>
          <ManeuverArrowIcon maneuver={maneuver} size={26} color="#FFFFFF" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.distance}>{formatDistance(distanceMeters)}</Text>
          <Text style={styles.instruction} numberOfLines={2}>
            {instruction || 'Continue on route'}
          </Text>
        </View>
      </View>

      {!!nextManeuver && !!nextInstruction && (
        <View style={styles.thenRow}>
          <Text style={styles.thenLabel}>{t('pickupNav.then')}</Text>
          <View style={styles.thenIconBadge}>
            <ManeuverArrowIcon
              maneuver={nextManeuver}
              size={14}
              color="rgba(255,255,255,0.75)"
            />
          </View>
          <Text style={styles.thenInstruction} numberOfLines={1}>
            {nextInstruction}
          </Text>
        </View>
      )}
    </View>
  );
};

export default NavigationInstructionBanner;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.ink,
    borderBottomLeftRadius: hscale(20),
    borderBottomRightRadius: hscale(20),
    paddingHorizontal: hscale(16),
    paddingBottom: vscale(12),
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(12),
  },
  iconBadge: {
    width: hscale(48),
    height: hscale(48),
    borderRadius: hscale(14),
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  distance: {
    color: '#FFFFFF',
    fontSize: fscale(20),
    fontWeight: '800',
    lineHeight: fscale(23),
  },
  instruction: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fscale(13),
    fontWeight: '600',
    marginTop: vscale(1),
  },
  thenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hscale(6),
    marginTop: vscale(10),
    paddingTop: vscale(8),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  thenLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: fscale(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  thenIconBadge: {
    width: hscale(20),
    height: hscale(20),
    borderRadius: hscale(6),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thenInstruction: {
    flex: 1,
    color: 'rgba(255,255,255,0.65)',
    fontSize: fscale(12),
    fontWeight: '600',
  },
});
