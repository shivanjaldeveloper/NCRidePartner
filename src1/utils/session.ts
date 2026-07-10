import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: assumes @react-native-async-storage/async-storage is already a
// dependency of this project (it's used the same way in your other apps —
// e.g. PGTI's @pgti_auth_token). If it isn't installed here yet:
//   npm install @react-native-async-storage/async-storage
const COOKIE_KEY = '@alopartner_cookie';

export const saveCookie = (cookie: string) =>
  AsyncStorage.setItem(COOKIE_KEY, cookie);

export const getCookie = () => AsyncStorage.getItem(COOKIE_KEY);

export const clearCookie = () => AsyncStorage.removeItem(COOKIE_KEY);
