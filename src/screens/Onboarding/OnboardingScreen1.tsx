import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import OnboardingTemplate from '../../components/onboarding/OnboardingTemplate';
import Onb1Illustration from '../../components/onboarding/illustrations/Onb1Illustration';
import { RootStackParamList } from '../../navigation/types';
import { markOnboardingSeen } from '../../utils/onboarding';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>;

const OnboardingScreen1 = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();

  return (
    <OnboardingTemplate
      step={0}
      title={t('onboarding.screen1.title')}
      sub={t('onboarding.screen1.sub')}
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
