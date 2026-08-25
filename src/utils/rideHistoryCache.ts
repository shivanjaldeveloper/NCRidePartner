import AsyncStorage from '@react-native-async-storage/async-storage';
import { RideHistoryItem } from '../services/api/ridesService';

// GetRideHistory returns every past ride in one shot (no server-side
// pagination), and that list only grows over a partner's lifetime — so
// re-fetching and re-parsing the whole thing on every visit to the Trips
// tab is the main reason it feels slow to open. This cache lets the
// screen paint instantly from the last-known list, then silently
// revalidate against the server and update both the screen and this
// cache once the fresh data lands. See TripHistoryScreen for the
// stale-while-revalidate usage.

const CACHE_KEY = '@alopartner_ride_history_cache';

interface RideHistoryCachePayload {
  rides: RideHistoryItem[];
  cachedAt: number;
}

export const getCachedRideHistory = async (): Promise<
  RideHistoryItem[] | null
> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: RideHistoryCachePayload = JSON.parse(raw);
    return Array.isArray(parsed?.rides) ? parsed.rides : null;
  } catch (err) {
    // Corrupt/unreadable cache shouldn't block the screen — just fall
    // through to a normal network fetch.
    console.warn('[rideHistoryCache] read failed:', err);
    return null;
  }
};

export const setCachedRideHistory = async (
  rides: RideHistoryItem[],
): Promise<void> => {
  try {
    const payload: RideHistoryCachePayload = { rides, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Best-effort — caching is a speed optimisation, not a requirement.
    console.warn('[rideHistoryCache] write failed:', err);
  }
};

export const clearRideHistoryCache = (): Promise<void> =>
  AsyncStorage.removeItem(CACHE_KEY).catch(err =>
    console.warn('[rideHistoryCache] clear failed:', err),
  );
