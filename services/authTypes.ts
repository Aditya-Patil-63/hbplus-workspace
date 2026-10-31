import { User } from 'firebase/auth';

export const AUTH_ERRORS = {
  UNAUTHORIZED_DOMAIN_MESSAGE:
    'Access restricted. Please login using your official domain email.',
  UNVERIFIED_EMAIL_MESSAGE:
    'Email not verified. Please verify your email before logging in.',
  MISSING_EMAIL_MESSAGE:
    'No email associated with this account. Please use a valid email account.',
  UNCONFIGURED_MESSAGE:
    'Firebase or Google OAuth configuration is missing. Please check your environment settings.',
  SIGN_IN_CANCELLED:
    'Sign-in was cancelled.',
  NETWORK_ERROR:
    'Network error. Check your connection and try again.',
  UNAUTHORIZED_FIREBASE_DOMAIN:
    'This domain is not authorized in Firebase. Contact the administrator.',
  POPUP_BLOCKED:
    'Popup was blocked by your browser. Redirecting to sign in...',
  DEFAULT_ERROR:
    'An unexpected authentication error occurred. Please try again.',
} as const;

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

/**
 * Checks whether an error is due to user cancellation (so it is not shown as a restricted-access banner).
 */
export function isCancelledError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'string') {
    return error.includes('SIGN_IN_CANCELLED') || error.includes('cancelled');
  }
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'auth/popup-closed-by-user' ||
    err.code === 'auth/cancelled-popup-request' ||
    err.code === 'SIGN_IN_CANCELLED' ||
    err.code === '12501' || // Android Google Sign In user cancellation code
    (typeof err.message === 'string' &&
      (err.message.includes('SIGN_IN_CANCELLED') ||
        err.message.includes('popup-closed-by-user') ||
        err.message.includes('cancelled')))
  );
}

/**
 * Maps Firebase and native auth error codes into user-friendly messages.
 */
export function mapAuthError(error: unknown): string {
  if (!error) return AUTH_ERRORS.DEFAULT_ERROR;

  if (isCancelledError(error)) {
    return AUTH_ERRORS.SIGN_IN_CANCELLED;
  }

  const err = error as { code?: string; message?: string };

  switch (err.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return AUTH_ERRORS.SIGN_IN_CANCELLED;
    case 'auth/network-request-failed':
      return AUTH_ERRORS.NETWORK_ERROR;
    case 'auth/popup-blocked':
      return AUTH_ERRORS.POPUP_BLOCKED;
    case 'auth/unauthorized-domain':
      return AUTH_ERRORS.UNAUTHORIZED_FIREBASE_DOMAIN;
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
      return AUTH_ERRORS.UNCONFIGURED_MESSAGE;
    default:
      if (typeof err.message === 'string' && err.message.length > 0) {
        return err.message;
      }
      return AUTH_ERRORS.DEFAULT_ERROR;
  }
}

