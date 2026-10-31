import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import {
  signInWithGoogle as authSignInWithGoogle,
  signOutUser,
  validateAndAccept,
  handleRedirectResult,
  mapAuthError,
  AuthResult,
} from '../services/authService';
import { isCancelledError } from '../services/authTypes';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type UserRole = 'admin' | 'user';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  isSigningIn: boolean;
  role: UserRole;
  signInWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Safely fetches the user's role from Firestore doc users/{uid}.
 * Client ONLY reads its own doc; missing doc or read failure safely defaults to 'user'.
 * Client NEVER writes role.
 */
async function fetchUserRole(uid: string): Promise<UserRole> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.role === 'admin') {
        return 'admin';
      }
    }
  } catch (_err) {
    // Incomplete config, missing doc, or network failure safely defaults to 'user'
  }
  return 'user';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    let isMounted = true;
    let unsubscribeAuth: (() => void) | undefined;

    async function setupAuth() {
      // 1. Handle Web Redirect flow result if returning from Google redirect
      try {
        const redirectResult = await handleRedirectResult();
        if (!isMounted) return;

        if (redirectResult) {
          if (redirectResult.ok) {
            const assignedRole = await fetchUserRole(redirectResult.user.uid);
            if (!isMounted) return;
            setUser(redirectResult.user);
            setRole(assignedRole);
            setStatus('authenticated');
            setError(null);
            return;
          } else {
            setUser(null);
            setRole('user');
            setStatus('unauthenticated');
            setError(redirectResult.error);
            return;
          }
        }
      } catch (redirectErr) {
        if (!isMounted) return;
        if (!isCancelledError(redirectErr)) {
          setError(mapAuthError(redirectErr));
        }
      }

      // 2. Subscribe to Firebase Auth state changes
      unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          // Re-validate domain & verified status on every session restore / refresh
          const validation = await validateAndAccept(firebaseUser);
          if (!isMounted) return;

          if (validation.ok) {
            const assignedRole = await fetchUserRole(validation.user.uid);
            if (!isMounted) return;
            setUser(validation.user);
            setRole(assignedRole);
            setStatus('authenticated');
            setError(null);
          } else {
            setUser(null);
            setRole('user');
            setStatus('unauthenticated');
            setError(validation.error);
          }
        } else {
          setUser(null);
          setRole('user');
          setStatus('unauthenticated');
        }
      });
    }

    setupAuth();

    return () => {
      isMounted = false;
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await authSignInWithGoogle();

      if (!result.ok) {
        if (!isCancelledError(result.error)) {
          setError(result.error);
        }
        return result;
      }

      const assignedRole = await fetchUserRole(result.user.uid);
      setUser(result.user);
      setRole(assignedRole);
      setStatus('authenticated');
      setError(null);
      return result;
    } catch (err) {
      if (isCancelledError(err)) {
        return { ok: false, error: 'Sign-in was cancelled.' };
      }
      const friendlyError = mapAuthError(err);
      setError(friendlyError);
      return { ok: false, error: friendlyError };
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('[AuthContext] Error during logout:', err);
    } finally {
      setUser(null);
      setRole('user');
      setStatus('unauthenticated');
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    error,
    isSigningIn,
    role,
    signInWithGoogle,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Access the AuthContext state and functions.
 * Throws an error if invoked outside of an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
