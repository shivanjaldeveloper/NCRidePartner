import { API_BASE_URL, API_BEARER_TOKEN } from './config';
import { ApiError, postAuthForm } from './httpClient';

/**
 * IMPORTANT — endpoint names/fields below are NOT confirmed against a real
 * curl/response, unlike VerifyNumber/VerifyOtp/ReSendOtp/VerifyCookie.
 * They're built to match the flow diagram ("API: UploadPartnerDocuments",
 * "API: SubmitPartnerApplication") and the confirmed `cookie` auth pattern
 * used everywhere else. Two things in particular are guesses that should be
 * verified with the backend team / a real curl sample before shipping:
 *   1. Whether UploadPartnerDocuments actually accepts multipart/form-data
 *      (likely, since it's handling file uploads) or expects base64 strings
 *      inside a regular x-www-form-urlencoded body like the other endpoints.
 *   2. The exact field key each document should be uploaded under — the
 *      keys below (selfPhoto, drivingLicence, vehicleRc, aadhaarCard,
 *      otherDocument) are named after the flow diagram's field labels.
 */

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

export type DocumentKey =
  | 'selfPhoto'
  | 'drivingLicence'
  | 'vehicleRc'
  | 'aadhaarCard'
  | 'otherDocument';

export interface UploadDocumentsResponse {
  Result: 'Success' | string;
  Message?: string;
  [key: string]: any;
}

export interface SubmitApplicationResponse {
  Result: 'Success' | string;
  Message?: string;
  [key: string]: any;
}

const UPLOAD_TIMEOUT_MS = 30000; // files take longer than plain form posts

/** Documents step — multipart upload of whichever files were picked, plus
 * the plain-text Vehicle Details fields from the same screen. */
export async function uploadPartnerDocuments(
  cookie: string,
  files: Partial<Record<DocumentKey, PickedFile>>,
  fields: Record<string, string> = {},
): Promise<UploadDocumentsResponse> {
  const form = new FormData();
  form.append('cookie', cookie);
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));

  Object.entries(files).forEach(([key, file]) => {
    if (!file) return;
    // @ts-ignore - React Native's FormData accepts this file-object shape
    form.append(key, { uri: file.uri, name: file.name, type: file.type });
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/UploadPartnerDocuments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_BEARER_TOKEN}`,
        // Deliberately no Content-Type here — letting fetch set the
        // multipart boundary itself is required for FormData uploads.
      },
      body: form,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(
        'Document upload timed out. Please check your connection and try again.',
      );
    }
    throw new ApiError(
      'Document upload failed. Check connectivity / API reachability.',
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const raw = await response.text();
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(
      'UploadPartnerDocuments returned a non-JSON response. Raw response attached — ' +
        'share this with Claude to fix the parser.',
      response.status,
      raw,
    );
  }

  const unwrapped =
    parsed && typeof parsed === 'object' && 'd' in parsed ? parsed.d : parsed;

  if (!response.ok) {
    const msg =
      (unwrapped && typeof unwrapped === 'object' && unwrapped.Message) ||
      `Document upload failed with HTTP ${response.status}`;
    throw new ApiError(msg, response.status, raw);
  }

  return unwrapped as UploadDocumentsResponse;
}

/** Final onboarding step — submits the application for review. */
export const submitPartnerApplication = (cookie: string) =>
  postAuthForm<SubmitApplicationResponse>('SubmitPartnerApplication', {
    cookie,
  });
