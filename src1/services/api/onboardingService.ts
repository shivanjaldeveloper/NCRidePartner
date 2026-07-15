import { API_BASE_URL, API_BEARER_TOKEN } from './config';
import { ApiError, postAuthForm } from './httpClient';

// Every endpoint in this file is confirmed against a real curl + response
// (unlike the earlier guessed UpdatePartnerProfile/UploadPartnerDocuments/
// SubmitPartnerApplication, which this replaces).

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

// Exact keys confirmed two ways: they're the field names on
// OnboardingGetProcessingDetails, AND they match the documentType value
// used in the OnboardingUploadPartnerDocument sample ("PersonalAadhaarCard").
export type DocumentKey =
  | 'PersonalSelfPhoto'
  | 'PersonalAadhaarCard'
  | 'PersonalPANCard'
  | 'PersonalDrivingLicence'
  | 'VehicleRC'
  | 'VehicleInsurance'
  | 'VehiclePUC'
  | 'VehicleFitness'
  | 'VehiclePermit'
  | 'VehicleNumberPlatePhoto'
  | 'VehicleFrontPhoto';

export interface ProcessingDetailsResponse {
  Result: 'Success' | string;
  Message?: string;
  ReferredBy?: string;
  PersonalSelfPhoto?: string;
  PersonalAadhaarCard?: string;
  PersonalPANCard?: string;
  PersonalDrivingLicence?: string;
  VehicleRegistration?: string;
  VehicleType?: string;
  VehicleModel?: string;
  VehicleRC?: string;
  VehicleInsurance?: string;
  VehiclePUC?: string;
  VehicleFitness?: string;
  VehiclePermit?: string;
  VehicleNumberPlatePhoto?: string;
  VehicleFrontPhoto?: string;
  Transaction?: string;
  /** Drives routing via resolveProcessingStatus — 'NEW' confirmed. */
  ProcessingStatus?: string;
  ProcessingDate?: string;
  ProcessingTime?: string;
  ProcessingBy?: string;
  Remark?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

export interface SimpleResultResponse {
  Result: 'Success' | string;
  Message?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

export interface UploadDocumentResponse {
  Result: 'Success' | string;
  Message?: string;
  DocumentType?: string;
  ImagePath?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

export interface ConfirmSubmissionResponse {
  Result: 'Success' | 'Error' | string;
  Message?: string;
  /** Only present when Result === 'Error', e.g. "Required Details Missing". */
  Error?: string;
  /** Human-readable list of what's missing, e.g. "Please complete the
   * following: Personal Self Photo, Vehicle RC, ..." — safe to show as-is. */
  ErrorDetail?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

/** Snapshot of everything filled in so far — used to resume onboarding
 * (which docs are already uploaded, current vehicle details, referral). */
export const getProcessingDetails = (cookie: string) =>
  postAuthForm<ProcessingDetailsResponse>('OnboardingGetProcessingDetails', {
    cookie,
  });

export const updateReferredBy = (cookie: string, referredBy: string) =>
  postAuthForm<SimpleResultResponse>('OnboardingReferredByUpdate', {
    cookie,
    referredBy,
  });

export const updateVehicleDetails = (
  cookie: string,
  vehicleRegistration: string,
  vehicleType: string,
  vehicleModel: string,
) =>
  postAuthForm<SimpleResultResponse>('OnboardingVehicleDetailsUpdate', {
    cookie,
    vehicleRegistration,
    vehicleType,
    vehicleModel,
  });

/** Final onboarding step. Returns Result:'Error' + ErrorDetail (not a
 * thrown/HTTP error) when required docs/fields are still missing — check
 * `Result` rather than relying on a catch block for that case. */
export const confirmSubmission = (cookie: string) =>
  postAuthForm<ConfirmSubmissionResponse>('OnboardingConfirmSubmission', {
    cookie,
  });

const UPLOAD_TIMEOUT_MS = 30000; // files take longer than plain form posts

/** Uploads exactly one document per call — confirmed via curl
 * (multipart: cookie, documentType, documentImage). */
export async function uploadPartnerDocument(
  cookie: string,
  documentType: DocumentKey,
  file: PickedFile,
): Promise<UploadDocumentResponse> {
  const form = new FormData();
  form.append('cookie', cookie);
  form.append('documentType', documentType);
  // @ts-ignore - React Native's FormData accepts this file-object shape
  form.append('documentImage', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/OnboardingUploadPartnerDocument`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_BEARER_TOKEN}`,
          // Deliberately no Content-Type — fetch sets the multipart
          // boundary itself for FormData bodies.
        },
        body: form,
        signal: controller.signal,
      },
    );
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(
        `Uploading ${documentType} timed out. Please check your connection and try again.`,
      );
    }
    throw new ApiError(
      `Uploading ${documentType} failed. Check connectivity / API reachability.`,
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
      `OnboardingUploadPartnerDocument returned a non-JSON response for ${documentType}. ` +
        'Raw response attached — share this with Claude to fix the parser.',
      response.status,
      raw,
    );
  }

  const unwrapped =
    parsed && typeof parsed === 'object' && 'd' in parsed ? parsed.d : parsed;

  if (!response.ok) {
    const msg =
      (unwrapped &&
        typeof unwrapped === 'object' &&
        (unwrapped.Message || unwrapped.Error)) ||
      `Upload of ${documentType} failed with HTTP ${response.status}`;
    throw new ApiError(msg, response.status, raw);
  }

  return unwrapped as UploadDocumentResponse;
}
