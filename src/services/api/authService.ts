import { postAuthForm } from './httpClient';

// Field names below are confirmed from real responses you shared —
// note the API uses PascalCase (Result, OtpTransaction, Cookie, etc),
// not the camelCase originally guessed.

export interface SendOtpResponse {
  Result: 'Success' | string;
  Message?: string;
  OtpTransaction?: string;
  Mobile?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

export interface VerifyOtpResponse {
  Result: 'Success' | string;
  Message?: string;
  Cookie?: string;
  Username?: string;
  Name?: string;
  Email?: string;
  /** Confirmed field — drives post-login routing. 'NEW' confirmed so far. */
  ProcessingStatus?: string;
  ResponseDateTime?: string;
  [key: string]: any;
}

export type VerifyCookieResponse = VerifyOtpResponse;

export interface UpdateProfileResponse {
  Result: 'Success' | string;
  Message?: string;
  [key: string]: any;
}

/** Login API / Registration API — same endpoint sends the OTP for both flows. */
export const sendOtp = (mobile: string) =>
  postAuthForm<SendOtpResponse>('VerifyNumber', { mobile });

/**
 * The UI only collects 4 digits from the partner, but the backend still
 * expects a 6-digit OTP — '56' is appended here as a fixed suffix before
 * the request goes out, so every caller can just pass the 4 digits the
 * user typed.
 */
export const verifyOtp = (otpTransaction: string, otp: string) =>
  postAuthForm<VerifyOtpResponse>('VerifyOtp', {
    otpTransaction,
    otp: `${otp}56`,
  });

export const resendOtp = (otpTransaction: string) =>
  postAuthForm<SendOtpResponse>('ReSendOtp', { otpTransaction });

/** Used on Splash for the local-cookie auto-login check, and as the Profile API (same endpoint). */
export const verifyCookie = (cookie: string) =>
  postAuthForm<VerifyCookieResponse>('VerifyCookie', { cookie });

export const getProfile = verifyCookie;

/**
 * Basic Details step. Confirmed via real curl/response —
 * response is just { Result, Message, ResponseDateTime }.
 */
export const updateOnboardingProfile = (
  cookie: string,
  name: string,
  email: string,
) =>
  postAuthForm<UpdateProfileResponse>('OnboardingUserProfileUpdate', {
    cookie,
    name,
    email,
  });
