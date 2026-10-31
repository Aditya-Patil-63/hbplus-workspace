import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, missingFirebaseEnvVars } from '../config/firebase';
import { ALLOWED_DOMAIN, isAllowedEmail } from '../utils/domainValidation';
import { AUTH_ERRORS, AuthResult, mapAuthError } from './authTypes';

export { AUTH_ERRORS, mapAuthError };
export type { AuthResult };

/**
 * Validates that an authenticated Firebase user satisfies all security constraints:
 * 1. user and user.email exist
 * 2. user.emailVerified === true
 * 3. isAllowedEmail(user.email) strictly matches ALLOWED_DOMAIN
 *
 * On any failure: immediately triggers signOut(auth) and returns the corresponding error.
 */
export async function validateAndAccept(user: User | null): Promise<AuthResult> {
  if (!user || !user.email) {
    try {
      await signOut(auth);
    } catch {}
    return {
      ok: false,
      error: AUTH_ERRORS.MISSING_EMAIL_MESSAGE,
    };
  }

  if (!user.emailVerified) {
    try {
      await signOut(auth);
    } catch {}
    return {
      ok: false,
      error: AUTH_ERRORS.UNVERIFIED_EMAIL_MESSAGE,
    };
  }

  if (!isAllowedEmail(user.email)) {
    try {
      await signOut(auth);
    } catch {}
    return {
      ok: false,
      error: AUTH_ERRORS.UNAUTHORIZED_DOMAIN_MESSAGE,
    };
  }

  return { ok: true, user };
}

/**
 * Handles Firebase redirect results on web page load / redirect return.
 */
export async function handleRedirectResult(): Promise<AuthResult | null> {
  if (!isFirebaseConfigured) {
    return null;
  }

  try {
    const result = await getRedirectResult(auth);
    if (!result || !result.user) {
      return null;
    }
    return await validateAndAccept(result.user);
  } catch (error) {
    return {
      ok: false,
      error: mapAuthError(error),
    };
  }
}

/**
 * Web Google Sign-In with popup, falling back to redirect if popup is blocked.
 */
export async function signInWithGoogleWeb(): Promise<AuthResult> {
  if (!isFirebaseConfigured) {
    return {
      ok: false,
      error: `Firebase configuration incomplete. Missing: ${missingFirebaseEnvVars.join(', ')}`,
    };
  }

  const provider = new GoogleAuthProvider();
  // UI hint for company domain and account chooser (never trusted as security boundary)
  provider.setCustomParameters({
    hd: ALLOWED_DOMAIN,
    prompt: 'select_account',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    return await validateAndAccept(result.user);
  } catch (error: any) {
    // If popup was blocked, fallback automatically to redirect flow
    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, provider);
        return {
          ok: false,
          error: AUTH_ERRORS.POPUP_BLOCKED,
        };
      } catch (redirectError) {
        return {
          ok: false,
          error: mapAuthError(redirectError),
        };
      }
    }

    return {
      ok: false,
      error: mapAuthError(error),
    };
  }
}

/**
 * Signs out the current user on web.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Unified export for platform-agnostic consumption
export const signInWithGoogle = signInWithGoogleWeb;

