import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingTemplate from '../../components/onboarding/OnboardingTemplate';
import Onb1Illustration from '../../components/onboarding/illustrations/Onb1Illustration';
import { RootStackParamList } from '../../navigation/types';
import { markOnboardingSeen } from '../../utils/onboarding';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>;

const OnboardingScreen1 = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <OnboardingTemplate
      step={0}
      title="Drive. Earn. Grow in NCR."
      sub="Join thousands of NCRide partners driving across Noida, Delhi, and Gurugram. Set your own hours and earn more."
      illustration={<Onb1Illustration />}
      onNext={() => navigation.navigate('Onboarding2')}
      onSkip={() => {
        markOnboardingSeen();
        navigation.navigate('Login');
      }}
    />
  );
};

export default OnboardingScreen1;
