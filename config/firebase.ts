import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore: getReactNativePersistence is exported in the React Native bundle
  getReactNativePersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseEnvVars: string[] = Object.entries(firebaseConfig)
  .filter(([_, v]) => !v)
  .map(([k]) => {
    switch (k) {
      case 'apiKey':
        return 'EXPO_PUBLIC_FIREBASE_API_KEY';
      case 'authDomain':
        return 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN';
      case 'projectId':
        return 'EXPO_PUBLIC_FIREBASE_PROJECT_ID';
      case 'storageBucket':
        return 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET';
      case 'messagingSenderId':
        return 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID';
      case 'appId':
        return 'EXPO_PUBLIC_FIREBASE_APP_ID';
      default:
        return k;
    }
  });

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;

if (!isFirebaseConfigured) {
  console.warn(
    `[HB Plus Workspace] Firebase configuration is incomplete. Missing environment variables:\n` +
      missingFirebaseEnvVars.map((v) => `  - ${v}`).join('\n') +
      `\nPlease copy .env.example to .env and configure your Firebase credentials.`
  );
}

// Initialize Firebase App once
export const app =
  getApps().length === 0
    ? initializeApp(
        isFirebaseConfigured
          ? firebaseConfig
          : {
              apiKey: 'UNCONFIGURED_KEY',
              authDomain: 'unconfigured.firebaseapp.com',
              projectId: 'unconfigured',
              storageBucket: 'unconfigured.appspot.com',
              messagingSenderId: '000000000000',
              appId: '1:000000000000:web:000000000000',
            }
      )
    : getApp();

// Initialize Auth with platform-appropriate persistence
let authInstance: Auth;

if (Platform.OS === 'web') {
  // Web uses default browserLocalPersistence managed by Firebase
  authInstance = getAuth(app);
} else {
  // Native uses AsyncStorage persistence, guarded against double initialization
  try {
    if (typeof getReactNativePersistence === 'function') {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      authInstance = getAuth(app);
    }
  } catch (_error) {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db: Firestore = getFirestore(app);

