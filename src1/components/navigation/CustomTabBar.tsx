import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../constants/Colors';
import { hscale, vscale, fscale } from '../../theme/scale';
import HomeIcon from '../../assets/icons/HomeIcon';
import ActivityIcon from '../../assets/icons/ActivityIcon';
import CashIcon from '../../assets/icons/CashIcon';
import AccountIcon from '../../assets/icons/AccountIcon';
import SosIcon from '../../assets/icons/SosIcon';

// NOTE: the design source uses `backdrop-filter: blur(28px)` for a frosted
// glass tab bar. Rather than pull in expo-blur / @react-native-community/blur
// for this one effect, this uses a highly translucent solid background —
// same "flat instead of exotic effect" call made on Splash's logo tile and
// the Verification/Home cards' gradients. Swap in a blur lib here if you'd
// rather have the real frosted look.
const TAB_ICONS: Record<
  string,
  React.FC<{ size: number; color: string; strokeWidth: number }>
> = {
  HomeTab: HomeIcon,
  TripsTab: ActivityIcon,
  EarningsTab: CashIcon,
  AccountTab: AccountIcon,
  SupportTab: SosIcon,
};

const TAB_LABELS: Record<string, string> = {
  HomeTab: 'Home',
  TripsTab: 'Trips',
  EarningsTab: 'Earnings',
  AccountTab: 'Account',
  SupportTab: 'Support',
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: vscale(14) + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const IconComponent = TAB_ICONS[route.name] || HomeIcon;
        const label = TAB_LABELS[route.name] || route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            {focused && <View style={styles.activeIndicator} />}
            <IconComponent
              size={22}
              color={focused ? Colors.ink : Colors.mute2}
              strokeWidth={focused ? 1.9 : 1.6}
            />
            <Text
              style={[
                styles.label,
                {
                  color: focused ? Colors.ink : Colors.mute,
                  fontWeight: focused ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: vscale(8),
    paddingHorizontal: hscale(8),
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopWidth: 0.5,
    borderTopColor: Colors.line,
  },
  tabButton: {
    alignItems: 'center',
    gap: vscale(3),
    paddingVertical: vscale(6),
    paddingHorizontal: hscale(8),
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: hscale(24),
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.lime,
  },
  label: {
    fontSize: fscale(10),
    letterSpacing: -0.1,
  },
});
