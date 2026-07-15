import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { getCookie, saveCookie, clearCookie } from './session';
import { verifyCookie } from '../services/api/authService';
import { resetToLogin } from '../navigation/navigationRef';

// "Check every 5-10 seconds" — 7s sits in the middle of that window, so
// worst-case detection (one missed tick + one request round trip) still
// comfortably lands inside the "kick them out within 10-15 seconds" ask.
const CHECK_INTERVAL_MS = 7000;

/**
 * Mounted once, for the lifetime of the app (see RootNavigator). On every
 * tick: if there's no stored cookie, does nothing — nobody's logged in to
 * watch. If there is one, calls VerifyCookie:
 *
 *  - No response / network error / timeout → ignored completely. We never
 *    log a partner out because of a bad connection, only because the
 *    server explicitly said the session is invalid.
 *  - { Result: "Success", ... } → session still good. VerifyCookie rotates
 *    the cookie on every call, so the fresh one is persisted or the very
 *    next tick would be checking with an already-dead cookie.
 *  - Anything else (e.g. { Result: "Error", Error: "Invalid session" },
 *    which is what an admin-disabled partner gets) → session is dead
 *    server-side. Clear the local cookie and force straight to Login.
 */
export function useSessionWatcher() {
  const checkingRef = useRef(false);

  useEffect(() => {
    const tick = async () => {
      // Don't stack a new check on top of a still-in-flight one (e.g. a
      // slow request from a previous tick that hasn't resolved yet).
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const cookie = await getCookie();
        if (!cookie) return;

        let res;
        try {
          res = await verifyCookie(cookie);
        } catch {
          // No response — per spec, ignore and just try again next tick.
          return;
        }

        if (res.Result === 'Success') {
          if (res.Cookie) await saveCookie(res.Cookie);
          return;
        }

        // Session invalidated server-side (admin disabled, revoked, etc).
        await clearCookie();
        resetToLogin();
        Alert.alert(
          'Session ended',
          res.Error || 'Your session is no longer valid. Please log in again.',
        );
      } finally {
        checkingRef.current = false;
      }
    };

    const interval = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
