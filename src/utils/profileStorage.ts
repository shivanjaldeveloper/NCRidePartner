import AsyncStorage from '@react-native-async-storage/async-storage';

// Same pattern as utils/session.ts — caches the partner's Name/Email/Username
// (from VerifyCookie) locally so HomeScreen/ProfileScreen can render them
// instantly on next app open, before the Splash VerifyCookie call resolves.
const PROFILE_KEY = '@alopartner_profile';

export interface PartnerProfileData {
  username: string;
  name: string;
  email: string;
}

export const saveProfile = (profile: PartnerProfileData) =>
  AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

export const getStoredProfile =
  async (): Promise<PartnerProfileData | null> => {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PartnerProfileData;
    } catch {
      return null;
    }
  };

export const clearProfile = () => AsyncStorage.removeItem(PROFILE_KEY);
