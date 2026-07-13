import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './tabTypes';

import CustomTabBar from '../components/navigation/CustomTabBar';
import HomeScreen from '../screens/Home/HomeScreen';
import TripHistoryScreen from '../screens/TripHistory/TripHistoryScreen';
import EarningsScreen from '../screens/Earnings/EarningsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SupportScreen from '../screens/Support/SupportScreen';

// NOTE: requires @react-native/bottom-tabs to be installed alongside your
// existing @react-navigation/native-stack:
//   npm install @react-navigation/bottom-tabs
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="TripsTab" component={TripHistoryScreen} />
      <Tab.Screen name="EarningsTab" component={EarningsScreen} />
      <Tab.Screen name="AccountTab" component={ProfileScreen} />
      <Tab.Screen name="SupportTab" component={SupportScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
