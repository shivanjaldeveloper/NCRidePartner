import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import OnboardingTemplate from '../../components/onboarding/OnboardingTemplate';
import Onb3Illustration from '../../components/onboarding/illustrations/Onb3Illustration';
import { RootStackParamList } from '../../navigation/types';
import { markOnboardingSeen } from '../../utils/onboarding';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding3'>;

const OnboardingScreen3 = () => {
  const navigation = useNavigation<NavProp>();
  const { t } = useTranslation();

  const goToLogin = () => {
    markOnboardingSeen();
    navigation.navigate('Login');
  };

  return (
    <OnboardingTemplate
      step={2}
      last
      title={t('onboarding.screen3.title')}
      sub={t('onboarding.screen3.sub')}
      illustration={<Onb3Illustration />}
      onNext={goToLogin}
      onSkip={goToLogin}
    />
  );
};

export default OnboardingScreen3;
