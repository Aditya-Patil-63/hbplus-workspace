import { Platform } from 'react-native';
import { User } from 'firebase/auth';
import { AUTH_ERRORS, AuthResult, mapAuthError } from './authTypes';
import * as webAuth from './authService.web';

export { AUTH_ERRORS, mapAuthError };
export type { AuthResult };

export async function validateAndAccept(user: User | null): Promise<AuthResult> {
  return webAuth.validateAndAccept(user);
}

export async function handleRedirectResult(): Promise<AuthResult | null> {
  if (Platform.OS === 'web') {
    return webAuth.handleRedirectResult();
  }
  return null;
}

export async function signInWithGoogle(): Promise<AuthResult> {
  if (Platform.OS === 'web') {
    return webAuth.signInWithGoogleWeb();
  }
  // Native bundle will be routed by Metro to authService.native.ts
  const nativeAuth = require('./authService.native');
  return nativeAuth.signInWithGoogleNative();
}

export async function signOutUser(): Promise<void> {
  if (Platform.OS === 'web') {
    return webAuth.signOutUser();
  }
  const nativeAuth = require('./authService.native');
  return nativeAuth.signOutUser();
}

