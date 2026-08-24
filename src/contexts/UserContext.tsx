import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getStoredProfile,
  saveProfile,
  clearProfile as clearStoredProfile,
  PartnerProfileData,
} from '../utils/profileStorage';

interface UserContextValue {
  /** null until Splash's VerifyCookie resolves (or a cached copy loads). */
  profile: PartnerProfileData | null;
  /** Called from SplashScreen (and anywhere else VerifyCookie/Profile APIs run) with the latest Name/Email/Username. */
  setProfile: (profile: PartnerProfileData) => void;
  /** Called on logout. */
  clearProfile: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * Mounted once above the navigator (see RootNavigator), same pattern as
 * RidePollingProvider. Holds the partner's Name/Email/Username so HomeScreen,
 * ProfileScreen, etc. all read the same real data instead of the old
 * PARTNER_PROFILE mock, without every screen re-fetching VerifyCookie itself.
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfileState] = useState<PartnerProfileData | null>(null);

  // Load whatever was cached from the previous session so the name doesn't
  // flash empty while Splash's VerifyCookie call is still in flight.
  useEffect(() => {
    (async () => {
      const cached = await getStoredProfile();
      if (cached) setProfileState(cached);
    })();
  }, []);

  const setProfile = useCallback((next: PartnerProfileData) => {
    setProfileState(next);
    saveProfile(next);
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    clearStoredProfile();
  }, []);

  return (
    <UserContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error(
      'useUser must be used within a UserProvider (check RootNavigator)',
    );
  }
  return ctx;
}
