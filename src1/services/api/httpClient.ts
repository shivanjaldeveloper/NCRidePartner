import { API_BASE_URL, API_BEARER_TOKEN } from './config';

export class ApiError extends Error {
  status?: number;
  raw?: string;

  constructor(message: string, status?: number, raw?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.raw = raw;
  }
}

/**
 * Posts a WebMethod endpoint under partnerauth.asmx as
 * application/x-www-form-urlencoded, matching the curl samples exactly.
 *
 * Confirmed response shape: plain JSON (not XML, not wrapped in `{"d": ...}`)
 * with PascalCase fields — `Result`, `Message`, `OtpTransaction`, `Cookie`,
 * `ProcessingStatus`, etc. The `{"d": ...}` unwrap below is kept as a no-op
 * safety net in case any endpoint behaves differently, but isn't needed for
 * the ones already tested.
 */
const REQUEST_TIMEOUT_MS = 15000;

export async function postAuthForm<T = any>(
  method: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) body.append(key, String(value));
  });

  // Guard against the request hanging forever on a dead connection —
  // without this, tapping "Send OTP" on a bad network just spins the
  // loading state with no way out until the OS-level socket timeout.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${API_BEARER_TOKEN}`,
      },
      body: body.toString(),
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    if (networkErr?.name === 'AbortError') {
      throw new ApiError(
        `${method} timed out. Please check your connection and try again.`,
      );
    }
    throw new ApiError(
      `Network request to ${method} failed. Check connectivity / API reachability.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await response.text();

  // Try to parse JSON regardless of HTTP status first — this ASMX service
  // may return a non-2xx status alongside a JSON body that still has a
  // useful `Message` field (e.g. auth/validation failures), and we don't
  // want to throw a generic "HTTP 400" when a real message is sitting
  // right there in the body.
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    if (!response.ok) {
      throw new ApiError(
        `${method} failed with HTTP ${response.status}`,
        response.status,
        raw,
      );
    }
    throw new ApiError(
      `${method} returned a non-JSON response (likely XML/SOAP). Raw response attached — ` +
        `share this with Claude to fix the parser.`,
      response.status,
      raw,
    );
  }

  // Unwrap ASP.NET ScriptService-style { "d": ... } responses if present.
  const unwrapped =
    parsed && typeof parsed === 'object' && 'd' in parsed ? parsed.d : parsed;

  if (!response.ok) {
    const msg =
      (unwrapped && typeof unwrapped === 'object' && unwrapped.Message) ||
      `${method} failed with HTTP ${response.status}`;
    throw new ApiError(msg, response.status, raw);
  }

  return unwrapped as T;
}
