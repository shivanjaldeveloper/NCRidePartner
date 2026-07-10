import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import SplashScreen from '../screens/Splash/SplashScreen';
import OnboardingScreen1 from '../screens/Onboarding/OnboardingScreen1';
import OnboardingScreen2 from '../screens/Onboarding/OnboardingScreen2';
import OnboardingScreen3 from '../screens/Onboarding/OnboardingScreen3';
import LoginScreen from '../screens/Auth/LoginScreen';
import BasicDetailsScreen from '../screens/BasicDetails/BasicDetailsScreen';
import PartnerDocumentsScreen from '../screens/PartnerDocuments/PartnerDocumentsScreen';
import ApplicationProcessingScreen from '../screens/ApplicationProcessing/ApplicationProcessingScreen';
import PermissionsScreen from '../screens/Permissions/PermissionsScreen';
import VerificationScreen from '../screens/Verification/VerificationScreen';
import TabNavigator from './TabNavigator';
import RideRequestScreen from '../screens/RideRequest/RideRequestScreen';
import PickupNavScreen from '../screens/PickupNav/PickupNavScreen';
import ArrivedScreen from '../screens/Arrived/ArrivedScreen';
import LiveTripScreen from '../screens/LiveTrip/LiveTripScreen';
import TripEarningsScreen from '../screens/TripEarnings/TripEarningsScreen';
import PassengerRatingScreen from '../screens/PassengerRating/PassengerRatingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding1" component={OnboardingScreen1} />
        <Stack.Screen name="Onboarding2" component={OnboardingScreen2} />
        <Stack.Screen name="Onboarding3" component={OnboardingScreen3} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="BasicDetails" component={BasicDetailsScreen} />
        <Stack.Screen
          name="PartnerDocuments"
          component={PartnerDocumentsScreen}
        />
        <Stack.Screen
          name="ApplicationProcessing"
          component={ApplicationProcessingScreen}
        />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="RideRequest" component={RideRequestScreen} />
        <Stack.Screen name="PickupNav" component={PickupNavScreen} />
        <Stack.Screen name="Arrived" component={ArrivedScreen} />
        <Stack.Screen name="LiveTrip" component={LiveTripScreen} />
        <Stack.Screen name="TripEarnings" component={TripEarningsScreen} />
        <Stack.Screen
          name="PassengerRating"
          component={PassengerRatingScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
