import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingTemplate from '../../components/onboarding/OnboardingTemplate';
import Onb3Illustration from '../../components/onboarding/illustrations/Onb3Illustration';
import { RootStackParamList } from '../../navigation/types';
import { markOnboardingSeen } from '../../utils/onboarding';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding3'>;

const OnboardingScreen3 = () => {
  const navigation = useNavigation<NavProp>();

  const goToLogin = () => {
    markOnboardingSeen();
    navigation.navigate('Login');
  };

  return (
    <OnboardingTemplate
      step={2}
      last
      title="Earnings on time. Always."
      sub="Track daily earnings, weekly payouts, and bonuses in real-time. NCRide Partner pays every Monday."
      illustration={<Onb3Illustration />}
      onNext={goToLogin}
      onSkip={goToLogin}
    />
  );
};

export default OnboardingScreen3;
