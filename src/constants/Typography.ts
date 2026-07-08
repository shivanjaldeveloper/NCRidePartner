import { fscale } from '../theme/scale';

export const Typography = {
  onboardingTitle: {
    fontSize: fscale(30),
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: fscale(33),
  },
  onboardingSub: {
    fontSize: fscale(15),
    fontWeight: '400' as const,
    lineHeight: fscale(21.75),
  },
  skipLabel: {
    fontSize: fscale(14),
    fontWeight: '600' as const,
  },
  splashTitle: {
    fontSize: fscale(32),
    fontWeight: '800' as const,
    letterSpacing: -1.2,
    color: '#FFFFFF',
  },
  splashSubtitle: {
    fontSize: fscale(12.5),
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
  },
  buttonLabel: {
    fontSize: fscale(16),
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
};
