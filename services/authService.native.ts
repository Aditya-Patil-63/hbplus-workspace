import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, missingFirebaseEnvVars } from '../config/firebase';
import { ALLOWED_DOMAIN, isAllowedEmail } from '../utils/domainValidation';
import { AUTH_ERRORS, AuthResult, mapAuthError } from './authTypes';

export { AUTH_ERRORS, mapAuthError };
export type { AuthResult };

/**
 * Configure Google Sign-In SDK for iOS and Android
 */
export function configureGoogleSignInNative(): void {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  GoogleSignin.configure({
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    hostedDomain: ALLOWED_DOMAIN,
  });
}

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
 * Native platforms do not use browser redirect results.
 */
export async function handleRedirectResult(): Promise<AuthResult | null> {
  return null;
}

/**
 * Native Google Sign-In using @react-native-google-signin/google-signin
 * and Firebase credential exchange.
 */
export async function signInWithGoogleNative(): Promise<AuthResult> {
  if (!isFirebaseConfigured) {
    return {
      ok: false,
      error: `Firebase configuration incomplete. Missing: ${missingFirebaseEnvVars.join(', ')}`,
    };
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    return {
      ok: false,
      error: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured in .env',
    };
  }

  try {
    configureGoogleSignInNative();

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();

    // Extract idToken without persisting it locally
    const idToken =
      (signInResult as any)?.data?.idToken ??
      (signInResult as any)?.idToken;

    if (!idToken) {
      throw new Error('Google Sign-In completed but no ID token was returned.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    return await validateAndAccept(userCredential.user);
  } catch (error: any) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return {
        ok: false,
        error: AUTH_ERRORS.SIGN_IN_CANCELLED,
      };
    }
    if (error?.code === statusCodes.IN_PROGRESS) {
      return {
        ok: false,
        error: 'Sign-in is already in progress.',
      };
    }
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        ok: false,
        error: 'Google Play Services not available or outdated.',
      };
    }

    return {
      ok: false,
      error: mapAuthError(error),
    };
  }
}

/**
 * Signs out from Firebase and Google Sign-In SDK on native platforms.
 */
export async function signOutUser(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Continue even if native google signout errors
  }
  await signOut(auth);
}

// Unified export for platform-agnostic consumption
export const signInWithGoogle = signInWithGoogleNative;

