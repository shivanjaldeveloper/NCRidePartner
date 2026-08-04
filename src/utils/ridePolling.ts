import { useCallback, useEffect, useRef, useState } from 'react';

import { getCookie } from './session';
import { getCurrentPositionQuick } from './locationTracker';
import { getPendingRides, PendingRide } from '../services/api/ridesService';

const LOG_PREFIX = '[RidePolling]';

// GetPendingRides' OfferExpirySeconds is 30 in the confirmed sample — poll
// well inside that window so a new offer shows up on the partner's screen
// almost immediately instead of waiting up to a full offer's lifetime to
// notice it. 6s keeps ~5 checks inside a single 30s offer window without
// hammering the endpoint.
const POLL_INTERVAL_MS = 6000;
const DEFAULT_OFFER_EXPIRY_SECONDS = 30;

export interface UseRidePollingResult {
  /** Every currently-pending offer the partner hasn't declined, nearest first. */
  incomingRides: PendingRide[];
  /** Server-reported offer countdown, in seconds. */
  offerExpirySeconds: number;
  /**
   * True once at least one GetPendingRides call has actually completed —
   * lets a consumer tell "haven't polled yet" apart from "polled, and
   * there's genuinely nothing pending right now" (both look like an empty
   * incomingRides array otherwise).
   */
  hasFetchedOnce: boolean;
  /**
   * Declines a single offer by RideTran — removes it from incomingRides
   * immediately and keeps it out for as long as the server keeps offering
   * it (a declined ride can still be sitting in the pending pool for other
   * partners, so the next poll tick would otherwise resurface it).
   */
  dismissRide: (rideTran: string) => void;
}

/**
 * Mount with `enabled = true` while the partner is online (same gate as
 * useLiveLocationTracker). Polls GetPendingRides every POLL_INTERVAL_MS and
 * surfaces every offer that hasn't already been declined this session —
 * the server itself can (and does) return more than one at once. Stops and
 * resets the moment `enabled` flips false.
 */
export function useRidePolling(enabled: boolean): UseRidePollingResult {
  const [incomingRides, setIncomingRides] = useState<PendingRide[]>([]);
  const [offerExpirySeconds, setOfferExpirySeconds] = useState(
    DEFAULT_OFFER_EXPIRY_SECONDS,
  );
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const inFlightRef = useRef(false);
  // RideTrans the partner has already declined this online session — see
  // dismissRide's doc comment above.
  const dismissedRef = useRef<Set<string>>(new Set());

  const dismissRide = useCallback((rideTran: string) => {
    dismissedRef.current.add(rideTran);
    setIncomingRides(prev => prev.filter(r => r.RideTran !== rideTran));
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIncomingRides([]);
      setHasFetchedOnce(false);
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
      console.log(`${LOG_PREFIX} tick start`, new Date().toISOString());

      try {
        const cookie = await getCookie();
        if (!cookie) {
          console.log(`${LOG_PREFIX} skip tick — no session cookie`);
          return;
        }

        let position: any;
        try {
          // Same quick-fix-first, GPS-fallback strategy as
          // useLiveLocationTracker — a plain low-accuracy-only fetch times
          // out and fails silently on devices/emulators without a network
          // location provider, which was previously making every poll
          // tick bail before GetPendingRides was ever called.
          if (typeof getCurrentPositionQuick !== 'function') {
            // This specific failure means locationTracker.ts in the
            // running app doesn't actually export getCurrentPositionQuick
            // — an unexported name resolves to undefined at import time
            // in RN/Metro rather than a build error, so this can silently
            // ship. If you see this, check locationTracker.ts has:
            //   export function getCurrentPositionQuick(): Promise<any> {
            console.error(
              `${LOG_PREFIX} getCurrentPositionQuick is not a function — ` +
                'locationTracker.ts is missing the export on that function. ' +
                'Every poll tick will silently no-op until it is exported.',
            );
            return;
          }
          position = await getCurrentPositionQuick();
        } catch (err: any) {
          console.warn(
            `${LOG_PREFIX} skip tick — location fix failed:`,
            err?.message || err,
          );
          return;
        }
        if (cancelled) return;

        const { latitude, longitude } = position.coords;
        console.log(`${LOG_PREFIX} requesting GetPendingRides`, {
          latitude,
          longitude,
        });
        const res = await getPendingRides(cookie, latitude, longitude);
        if (cancelled) return;

        console.log(`${LOG_PREFIX} response`, {
          result: res.Result,
          rideCount: res.RideCount,
          rideTrans: (res.Rides || []).map(r => r.RideTran),
        });

        if (res.Result !== 'Success') {
          console.warn(`${LOG_PREFIX} GetPendingRides rejected:`, res);
          return;
        }

        const expiry = Number(res.OfferExpirySeconds);
        if (!Number.isNaN(expiry) && expiry > 0) {
          setOfferExpirySeconds(expiry);
        }

        const rides = (res.Rides || []).filter(
          r => !dismissedRef.current.has(r.RideTran),
        );
        setHasFetchedOnce(true);

        setIncomingRides(prev => {
          const prevIds = prev.map(r => r.RideTran).join(',');
          const nextIds = rides.map(r => r.RideTran).join(',');
          // Same set of offers (order included) — keep the same array
          // reference so screens depending on it don't re-render/re-poll
          // for nothing.
          if (prevIds === nextIds) return prev;
          const added = rides.filter(
            r => !prev.some(p => p.RideTran === r.RideTran),
          );
          const removed = prev.filter(
            p => !rides.some(r => r.RideTran === p.RideTran),
          );
          if (added.length) {
            console.log(
              `${LOG_PREFIX} new offer(s):`,
              added.map(r => r.RideTran),
            );
          }
          if (removed.length) {
            console.log(
              `${LOG_PREFIX} offer(s) no longer pending:`,
              removed.map(r => r.RideTran),
            );
          }
          return rides;
        });
      } catch (err: any) {
        console.warn(`${LOG_PREFIX} tick failed:`, err?.message || err);
      } finally {
        inFlightRef.current = false;
        console.log(`${LOG_PREFIX} tick end`, new Date().toISOString());
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

  return { incomingRides, offerExpirySeconds, hasFetchedOnce, dismissRide };
}
