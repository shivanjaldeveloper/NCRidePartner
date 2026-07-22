import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import OnboardingTemplate from '../../components/onboarding/OnboardingTemplate';
import Onb2Illustration from '../../components/onboarding/illustrations/Onb2Illustration';
import { RootStackParamList } from '../../navigation/types';
import { markOnboardingSeen } from '../../utils/onboarding';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding2'>;

const OnboardingScreen2 = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();

  return (
    <OnboardingTemplate
      step={1}
      title={t('onboarding.screen2.title')}
      sub={t('onboarding.screen2.sub')}
      illustration={<Onb2Illustration />}
      onNext={() => navigation.navigate('Onboarding3')}
      onSkip={() => {
        markOnboardingSeen();
        navigation.navigate('Login');
      }}
    />
  );
};

export default OnboardingScreen2;
