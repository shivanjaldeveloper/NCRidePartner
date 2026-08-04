import React, { createContext, useContext, useState } from 'react';

import { useRidePolling, UseRidePollingResult } from '../utils/ridePolling';

interface RidePollingContextValue extends UseRidePollingResult {
  setPollingEnabled: (enabled: boolean) => void;
}

const RidePollingContext = createContext<RidePollingContextValue | null>(null);

/**
 * Mounted once above the navigator (see RootNavigator) so HomeScreen and
 * RideRequestScreen share the exact same GetPendingRides polling loop
 * instead of each running their own.
 *
 * Two independent pollers previously caused a real bug: RideRequestScreen
 * had its own copy of useRidePolling, hitting GetPendingRides with its own
 * GPS fix on its own timer. If that second poll's timing/location ever
 * disagreed with the one that had just triggered navigation into the
 * screen — even a race of a second or two, or a slightly different GPS
 * fix nudging the offer outside the search radius — it would conclude
 * "no rides" and immediately bounce the partner back to MainTabs. From
 * the outside that looked like "nothing happening" even though the
 * server genuinely had a ride waiting. Sharing one instance here removes
 * the race entirely: there's only ever one source of truth for what's
 * currently pending.
 */
export const RidePollingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [enabled, setPollingEnabled] = useState(false);
  const polling = useRidePolling(enabled);

  return (
    <RidePollingContext.Provider value={{ ...polling, setPollingEnabled }}>
      {children}
    </RidePollingContext.Provider>
  );
};

export function useRidePollingContext(): RidePollingContextValue {
  const ctx = useContext(RidePollingContext);
  if (!ctx) {
    throw new Error(
      'useRidePollingContext must be used within a RidePollingProvider (check RootNavigator)',
    );
  }
  return ctx;
}
