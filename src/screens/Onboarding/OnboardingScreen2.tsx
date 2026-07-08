import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingTemplate from '../../components/onboarding/OnboardingTemplate';
import Onb2Illustration from '../../components/onboarding/illustrations/Onb2Illustration';
import { RootStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding2'>;

const OnboardingScreen2 = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <OnboardingTemplate
      step={1}
      title="All vehicles. All zones."
      sub="Drive a car, auto, e-rickshaw, or bike taxi. Cover NCR from Noida to Gurugram — on your terms."
      illustration={<Onb2Illustration />}
      onNext={() => navigation.navigate('Onboarding3')}
      onSkip={() => navigation.navigate('Login')}
    />
  );
};

export default OnboardingScreen2;
