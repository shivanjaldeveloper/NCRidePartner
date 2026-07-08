import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { hscale, vscale } from '../../theme/scale';
import TopSafeStrap from '../layout/TopSafeStrap';
import SkipLink from '../common/SkipLink';
import Dots from '../common/Dots';
import PrimaryButton from '../common/PrimaryButton';

interface Props {
  step: number;
  title: string;
  sub: string;
  illustration: React.ReactNode;
  onNext: () => void;
  onSkip: () => void;
  last?: boolean;
}

const OnboardingTemplate: React.FC<Props> = ({
  step,
  title,
  sub,
  illustration,
  onNext,
  onSkip,
  last = false,
}) => {
  return (
    <View style={styles.container}>
      <TopSafeStrap backgroundColor={Colors.bg} />

      {/* Top row: Skip, right-aligned. Source padding: '64px 24px 0' */}
      <View style={styles.topRow}>
        <SkipLink onPress={onSkip} />
      </View>

      {/* Middle: illustration + title + sub, centered */}
      <View style={styles.middle}>
        <View style={styles.illuBox}>{illustration}</View>
        <Text style={[Typography.onboardingTitle, styles.title]}>{title}</Text>
        <Text style={[Typography.onboardingSub, styles.sub]}>{sub}</Text>
      </View>

      {/* Bottom row: Dots + Button. Source padding: '0 24px 90px' */}
      <View style={styles.bottomRow}>
        <Dots total={3} activeIndex={step} />
        <PrimaryButton
          label={last ? 'Get started' : 'Next'}
          onPress={onNext}
          icon={last ? 'check' : 'arrowRight'}
        />
      </View>
    </View>
  );
};

export default OnboardingTemplate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topRow: {
    paddingTop: vscale(24),
    paddingHorizontal: hscale(24),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hscale(28),
  },
  illuBox: {
    width: hscale(260),
    height: hscale(260),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: vscale(28),
    color: Colors.ink,
    textAlign: 'center',
  },
  sub: {
    marginTop: vscale(12),
    color: Colors.mute,
    textAlign: 'center',
    maxWidth: hscale(300),
  },
  bottomRow: {
    paddingHorizontal: hscale(24),
    paddingBottom: vscale(90),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
