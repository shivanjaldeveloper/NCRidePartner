import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Lets non-screen code (utils/sessionWatcher.ts) force navigation without
// needing a useNavigation() hook — attach this to <NavigationContainer ref={navigationRef}>.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Drops the entire nav stack and lands on Login — used when the session
 * is found to be invalid server-side (e.g. admin disabled the partner). */
export function resetToLogin() {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
}
