# HB Plus Workspace - Authentication Flow Architecture

This document details the cross-platform authentication flow, security boundaries, and session lifecycle implemented in **HB Plus Workspace**.

---

## 1. High-Level Architecture Overview

The system strictly enforces corporate identity verification for `@hbplus.fit` accounts across both Web and Native platforms.

```
+-----------------------------------------------------------------------------------------+
|                                     CLIENT RUNTIME                                      |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [ User clicks "Continue with Google" ]                                                 |
|                 │                                                                       |
|                 ▼                                                                       |
|         Platform Detection                                                              |
|          ├── Web (Metro Web / SPA)                                                      |
|          │    └── GoogleAuthProvider (hd: 'hbplus.fit')                                 |
|          │        ├── signInWithPopup()                                                 |
|          │        └── Fallback on popup-blocked: signInWithRedirect()                   |
|          │                                                                              |
|          └── Native (iOS / Android)                                                     |
|               └── @react-native-google-signin/google-signin                             |
|                   ├── GoogleSignin.hasPlayServices()                                    |
|                   ├── GoogleSignin.signIn() -> idToken (unpersisted)                    |
|                   └── signInWithCredential(auth, credential)                            |
|                                                                                         |
|                 │                                                                       |
|                 ▼                                                                       |
|     Firebase User Credential Returned                                                   |
|                 │                                                                       |
|                 ▼                                                                       |
|    validateAndAccept(user) Security Gate                                               |
|    ├── Check 1: User & user.email exist?                                                |
|    ├── Check 2: user.emailVerified === true?                                            |
|    └── Check 3: isAllowedEmail(user.email) === true (Strict '@hbplus.fit' match)        |
|                 │                                                                       |
|         ┌───────┴───────┐                                                               |
|         │               │                                                               |
|      [ PASS ]        [ FAIL ]                                                           |
|         │               │                                                               |
|         ▼               ▼                                                               |
|  Fetch Role (users/uid) Immediately signOut(auth)                                      |
|  Status: authenticated  Clear user state                                                |
|  Render Dashboard       Status: unauthenticated                                         |
|                         Display: "Access restricted. Please login using..."             |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Authentication Lifecycle States

The application manages authentication state centrally via `contexts/AuthContext.tsx`:

* **`loading`**: Initial state on application boot. Displays `components/LoadingScreen.tsx`. Protected routes block rendering until session resolution completes.
* **`authenticated`**: User has an active Firebase session that passed `validateAndAccept`.
* **`unauthenticated`**: No session, user logged out, or session validation failed. Redirects to `/login`.

---

## 3. Platform-Specific Implementations

### A. Web Flow (`services/authService.web.ts`)
1. **Popup Flow (`signInWithPopup`)**:
   * Initializes `GoogleAuthProvider` with custom parameter `{ hd: 'hbplus.fit', prompt: 'select_account' }`.
   * Note: The `hd` parameter is treated purely as a UI convenience to pre-filter Google's account picker; it is **never** relied upon as a security boundary.
2. **Popup Blocked Fallback (`signInWithRedirect`)**:
   * If the user's browser blocks popups (`auth/popup-blocked`), the service automatically falls back to `signInWithRedirect`.
3. **Redirect Resolution (`handleRedirectResult`)**:
   * Upon page reload following a redirect, `handleRedirectResult()` resolves credentials via `getRedirectResult(auth)` and runs `validateAndAccept`.
4. **Web Persistence**:
   * Firebase automatically manages `browserLocalPersistence` (IndexedDB / localStorage) without application code touching storage.

### B. Native Flow (`services/authService.native.ts`)
1. **Module Isolation**:
   * Native Google Sign-In requires `@react-native-google-signin/google-signin` and native CocoaPods / Gradle code.
   * Isolated using Metro's platform file resolution (`authService.web.ts` vs `authService.native.ts`) so the web bundle is never polluted with native modules.
2. **Credential Exchange**:
   * `GoogleSignin.configure({ webClientId, iosClientId, hostedDomain })`.
   * Retrieves `idToken` from Google Sign-In dialog.
   * Passes `idToken` directly to `GoogleAuthProvider.credential(idToken)` and authenticates via `signInWithCredential(auth, credential)`.
   * **Zero token persistence**: Neither Google ID tokens nor access tokens are stored in AsyncStorage or anywhere in user code.
3. **Native Persistence**:
   * Initialized with `getReactNativePersistence(AsyncStorage)` via Firebase Auth modular initialization.

---

## 4. Strict Domain Validation Algorithm

Implemented in `utils/domainValidation.ts`:

```typescript
export const ALLOWED_DOMAIN = (process.env.EXPO_PUBLIC_ALLOWED_DOMAIN ?? 'hbplus.fit').toLowerCase();

export function isAllowedEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const parts = normalized.split('@');
  if (parts.length !== 2) return false;

  const [username, domain] = parts;
  if (!username || !domain) return false;

  return domain === ALLOWED_DOMAIN;
}
```

### Threat Scenarios Mitigated:
* **Subdomain Traversal Attack**: `user@hbplus.fit.evil.com` -> `parts[1]` is `"hbplus.fit.evil.com"` -> **REJECTED**.
* **Prefix Spoofing**: `user@evilhbplus.fit` -> `parts[1]` is `"evilhbplus.fit"` -> **REJECTED**.
* **Internal Subdomain**: `user@sub.hbplus.fit` -> `parts[1]` is `"sub.hbplus.fit"` -> **REJECTED**.
* **Delimiter Injection**: `a@b@hbplus.fit` -> `parts.length === 3` -> **REJECTED**.
* **Missing Identifiers**: `@hbplus.fit` or `user@` -> **REJECTED**.
* **Non-company email**: `user@gmail.com` -> **REJECTED**.

---

## 5. Session Restoration & Refresh Protection

When a user refreshes the page or reopens the mobile app:
1. `AuthContext` mounts and initializes Firebase's `onAuthStateChanged` listener.
2. If Firebase restores a cached session, `onAuthStateChanged` receives the restored user object.
3. `validateAndAccept(firebaseUser)` runs **immediately**:
   * Verifies `user.emailVerified === true`.
   * Verifies `isAllowedEmail(user.email) === true`.
4. If validation fails for any reason:
   * `await signOut(auth)` is triggered immediately.
   * User state is cleared.
   * Context sets `status = 'unauthenticated'` and displays the restriction banner.
   * Protected routes immediately eject to `/login`.

---

## 6. Role-Based Access Control (RBAC)

* **Read-Only Model**: After client validation succeeds, `AuthContext` queries `users/{uid}` via Firestore `getDoc`.
* If `doc.data().role === 'admin'`, the user is granted `'admin'` status in context; otherwise `'user'`.
* **Security Rule Protection**: `firestore.rules` enforces that clients **can never write** the `role` field. Roles must be granted manually via the Firebase Console by an administrator.
