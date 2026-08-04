import { useCallback, useEffect, useRef, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';

import { getCookie } from './session';
import { getPendingRides, PendingRide } from '../services/api/ridesService';

const LOG_PREFIX = '[RidePolling]';

// GetPendingRides' OfferExpirySeconds is 30 in the confirmed sample — poll
// well inside that window so a new offer shows up on the partner's screen
// almost immediately instead of waiting up to a full offer's lifetime to
// notice it. 6s keeps ~5 checks inside a single 30s offer window without
// hammering the endpoint.
const POLL_INTERVAL_MS = 6000;
const DEFAULT_OFFER_EXPIRY_SECONDS = 30;

// Low-accuracy + a generous maximumAge so most ticks resolve from the
// OS/GPS cache instead of forcing a fresh fix every 6s — search-radius
// matching doesn't need survey-grade precision, and this keeps the poll
// cheap on battery. useLiveLocationTracker (separate hook) is still the
// one sending high-accuracy speed/heading pings for live tracking.
function getPollPosition(): Promise<any> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 20000,
    });
  });
}

export interface UseRidePollingResult {
  /** The current ride offer to show in the sheet, or null if none. */
  incomingRide: PendingRide | null;
  /** Server-reported offer countdown, in seconds. */
  offerExpirySeconds: number;
  /**
   * Call on decline (or auto-expiry) — hides the sheet immediately and
   * prevents the same RideTran from popping back up on the next poll tick
   * for as long as the server keeps offering it. A genuinely new offer
   * (different RideTran) will still show.
   */
  dismissIncomingRide: () => void;
}

/**
 * Mount with `enabled = true` while the partner is online (same gate as
 * useLiveLocationTracker). Polls GetPendingRides every POLL_INTERVAL_MS and
 * surfaces the first (nearest) offer that hasn't already been dismissed
 * this session. Stops and resets the moment `enabled` flips false.
 */
export function useRidePolling(enabled: boolean): UseRidePollingResult {
  const [incomingRide, setIncomingRide] = useState<PendingRide | null>(null);
  const [offerExpirySeconds, setOfferExpirySeconds] = useState(
    DEFAULT_OFFER_EXPIRY_SECONDS,
  );
  const inFlightRef = useRef(false);
  // RideTrans the partner has already declined/let expire this online
  // session — a declined ride can still be sitting in the pending pool for
  // other partners, so the next poll tick would otherwise resurface it.
  const dismissedRef = useRef<Set<string>>(new Set());

  const dismissIncomingRide = useCallback(() => {
    setIncomingRide(prev => {
      if (prev) dismissedRef.current.add(prev.RideTran);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIncomingRide(null);
      dismissedRef.current.clear();
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (inFlightRef.current) {
        console.log(`${LOG_PREFIX} skip tick — previous poll still in flight`);
        return;
      }
      inFlightRef.current = true;

      try {
        const cookie = await getCookie();
        if (!cookie) {
          console.log(`${LOG_PREFIX} skip tick — no session cookie`);
          return;
        }

        let position: any;
        try {
          position = await getPollPosition();
        } catch (err: any) {
          console.warn(
            `${LOG_PREFIX} skip tick — location fix failed:`,
            err?.message || err,
          );
          return;
        }
        if (cancelled) return;

        const { latitude, longitude } = position.coords;
        const res = await getPendingRides(cookie, latitude, longitude);
        if (cancelled) return;

        if (res.Result !== 'Success') {
          console.warn(`${LOG_PREFIX} GetPendingRides rejected:`, res);
          return;
        }

        const expiry = Number(res.OfferExpirySeconds);
        if (!Number.isNaN(expiry) && expiry > 0) {
          setOfferExpirySeconds(expiry);
        }

        const rides = res.Rides || [];
        const next =
          rides.find(r => !dismissedRef.current.has(r.RideTran)) || null;

        setIncomingRide(prev => {
          // Same offer still showing — leave it (and its countdown) alone.
          if (prev && next && prev.RideTran === next.RideTran) return prev;
          // Offer the partner was looking at has disappeared server-side
          // (expired / taken by someone else) — clear it.
          if (prev && !next) {
            console.log(
              `${LOG_PREFIX} offer ${prev.RideTran} no longer pending`,
            );
            return null;
          }
          if (next) {
            console.log(`${LOG_PREFIX} new offer:`, next.RideTran);
          }
          return next;
        });
      } catch (err: any) {
        console.warn(`${LOG_PREFIX} tick failed:`, err?.message || err);
      } finally {
        inFlightRef.current = false;
      }
    };

    tick(); // check immediately on going online, don't wait a full interval
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    console.log(`${LOG_PREFIX} started — every ${POLL_INTERVAL_MS / 1000}s`);

    return () => {
      cancelled = true;
      clearInterval(interval);
      console.log(`${LOG_PREFIX} stopped`);
    };
  }, [enabled]);

  return { incomingRide, offerExpirySeconds, dismissIncomingRide };
}
