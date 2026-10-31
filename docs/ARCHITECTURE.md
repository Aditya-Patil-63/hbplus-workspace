# HB Plus Workspace - Architectural Technical Specification

This document provides a comprehensive technical overview of the software architecture, design patterns, security boundaries, and platform implementations in **HB Plus Workspace**.

---

## 1. System Architecture & Directory Responsibilities

The codebase adheres to a modular, platform-isolated directory structure built on **Expo Router** and **React Native for Web**:

```text
├── app/                  # File-based routing and page wrappers
│   ├── _layout.tsx       # Root application layout (SafeAreaProvider, AuthProvider, Slot)
│   ├── index.tsx         # Root redirect gate (/ -> /dashboard or /login)
│   ├── login.tsx         # Responsive split-screen login page
│   └── dashboard.tsx     # Authenticated enterprise operations portal
├── components/           # Reusable presentational components
│   ├── Badge.tsx         # Dynamic pill badges (success, info, neutral, danger)
│   ├── GoogleLoginButton.tsx # 52px touch-friendly Google SSO button with loading/hover
│   ├── LoadingScreen.tsx # Animated "HB+" splash screen with ActivityIndicator
│   ├── ProfileCard.tsx   # User profile card with photo & fallback initials avatar
│   └── ProtectedRoute.tsx # Render-blocking gate for authenticated route protection
├── config/               # Infrastructure & Firebase initialization
│   └── firebase.ts       # Modular Firebase app, auth persistence, and Firestore setup
├── constants/            # Centralized design tokens
│   └── theme.ts          # Color palette, spacing, radii, typography, shadows, layout
├── contexts/             # Application state & lifecycle management
│   └── AuthContext.tsx   # Global auth state, session hydration, and role evaluation
├── docs/                 # Engineering documentation & setup guides
│   ├── ARCHITECTURE.md   # System architectural specification (this document)
│   ├── AUTHENTICATION_FLOW.md # Visual lifecycle diagrams and state machine
│   ├── FIREBASE_SETUP.md # Step-by-step Firebase & Google Cloud console guide
│   ├── PROJECT_COMPLETION_REPORT.md # Comprehensive milestone log
│   └── TESTING_CHECKLIST.md # 16-point QA verification matrix with evidence links
├── services/             # Authentication services and platform adapters
│   ├── authService.ts    # Unified entry point for platform dispatch
│   ├── authService.web.ts # Web SDK implementation (popup, redirect fallback)
│   ├── authService.native.ts # Native iOS/Android Google Sign-In SDK adapter
│   └── authTypes.ts      # Error constants, cancellation checks, error mapper
├── utils/                # Pure business logic and domain verification
│   ├── domainValidation.ts # Strict email domain whitelisting algorithm
│   └── domainValidation.test.ts # 14-scenario unit test suite
├── firestore.rules       # Cloud Firestore database security constraints
├── netlify.toml          # Production build configuration and SPA 200 rewrites
└── app.json              # Expo application manifest and native configurations
```

---

## 2. Authentication Workflow & Lifecycle States

The application manages authentication state centrally via [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx) using three explicit states:

```
[ Boot / Reload ] ─────────► 'loading'
                                │
                                ▼
                       validateAndAccept()
                     ┌──────────┴──────────┐
                     │                     │
                  [ Valid ]             [ Invalid ]
                     │                     │
                     ▼                     ▼
             'authenticated'       'unauthenticated'
             (Render Portal)       (Redirect to /login)
```

1. **`loading`**: Default state on application initialization. Protected routes block component rendering and display `<LoadingScreen />`.
2. **`authenticated`**: User holds a valid Firebase Auth session matching `@hbplus.fit` with `emailVerified === true`.
3. **`unauthenticated`**: No session, user logged out, or session validation failed. Any access to protected pages redirects immediately to `/login`.

---

## 3. Platform File Splitting & Native Isolation

To guarantee that native libraries do not enter web JavaScript bundles, authentication services are partitioned using Metro platform extensions:

* **Entry Dispatcher (`services/authService.ts`)**: Exports a unified API (`signInWithGoogle()`, `signOutUser()`, `validateAndAccept()`). On Web, it invokes `authService.web.ts`. On Native, it resolves `authService.native.ts`.
* **Web Implementation (`services/authService.web.ts`)**:
  * Utilizes Firebase Web Modular SDK (`signInWithPopup`).
  * Includes automated fallback to `signInWithRedirect` when browser popup blockers intercept requests (`auth/popup-blocked`).
  * Resolves redirect credentials upon page return via `handleRedirectResult()`.
  * Passes `hd: ALLOWED_DOMAIN` parameter purely as a UI convenience hint for Google's account picker (never trusted as a security boundary).
* **Native Implementation (`services/authService.native.ts`)**:
  * Uses `@react-native-google-signin/google-signin` native credential exchange.
  * Retrieves `idToken` from native Google Play / Apple dialogs.
  * Exchanges `idToken` directly via `GoogleAuthProvider.credential(idToken)` and `signInWithCredential()`.
  * **Zero token persistence**: Neither Google ID tokens nor refresh tokens are stored in application storage or `AsyncStorage`.

---

## 4. Firebase Integration & Session Persistence

Configured in [`config/firebase.ts`](../config/firebase.ts):

* **Modular Firebase v13**: Uses tree-shakeable modular functions (`initializeApp`, `getAuth`, `getFirestore`).
* **Platform Persistence**:
  * **Web**: Default `browserLocalPersistence` managed natively by Firebase inside IndexedDB / localStorage.
  * **Native**: Configured with `getReactNativePersistence(AsyncStorage)` guarded against duplicate initialization.
* **Non-Crashing Configuration Guard**: Missing environment variables trigger console warnings in development without unhandled runtime exceptions.

---

## 5. Strict Domain Validation Algorithm

Implemented in [`utils/domainValidation.ts`](../utils/domainValidation.ts):

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

### Threat Vector Defense:
* **Evil Suffix Attacks**: `user@hbplus.fit.evil.com` -> `parts[1]` is `'hbplus.fit.evil.com'` !== `'hbplus.fit'` (**REJECTED**).
* **Prefix Attacks**: `user@evilhbplus.fit` -> `parts[1]` is `'evilhbplus.fit'` !== `'hbplus.fit'` (**REJECTED**).
* **Subdomain Spoofing**: `user@sub.hbplus.fit` -> `parts[1]` is `'sub.hbplus.fit'` !== `'hbplus.fit'` (**REJECTED**).
* **Multiple `@` Symbols**: `a@b@hbplus.fit` -> `parts.length === 3` !== `2` (**REJECTED**).
* **Malformed Inputs**: `""`, `null`, `undefined`, `"@hbplus.fit"`, `"user@"`, `"   "` (**REJECTED**).

---

## 6. Route Protection & Zero Content Leakage

Implemented via [`components/ProtectedRoute.tsx`](../components/ProtectedRoute.tsx):

* Wraps authenticated route trees.
* If `status === 'loading'`, mounts `<LoadingScreen message="Validating secure session..." />`. Child components are **never mounted** prior to session validation.
* If `status === 'unauthenticated'`, executes `<Redirect href="/login" />`.
* Prevents data exposure to unauthenticated sessions even if DOM inspection is attempted.

---

## 7. Secure Sign-Out & History Management

Implemented in [`app/dashboard.tsx`](../app/dashboard.tsx) and [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx):

* User clicks "Sign Out".
* Invokes `signOutUser()`, terminating the active Firebase session across all tabs and clearing client user state.
* Executes `router.replace('/login')` (replacing history entry instead of pushing).
* Clicking the browser's "Back" button cannot navigate back to the protected dashboard.

---

## 8. Role-Based Access Control (RBAC)

Implemented via Cloud Firestore integration:

* **Document Structure**: Collection `users/{uid}` with field `role: "admin" | "user"`.
* **Client Write Prohibition**: Cloud Firestore rules (`firestore.rules`) enforce `allow write: if false;`. Role escalation by client code is impossible.
* **Client Read Scope**: Users may only read their own document: `allow read: if isCompany() && request.auth.uid == uid;`.
* **Safe Fallback**: If a user document is missing or network read fails, the client defaults securely to `role: 'user'`.

---

## 9. Environment Variable Specification

All configuration is driven by non-secret build-time environment variables:

| Variable Name | Description | Environment |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_ALLOWED_DOMAIN` | Authorized corporate domain (e.g. `hbplus.fit`) | Web & Native |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key | Web & Native |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Authentication domain | Web & Native |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project identifier | Web & Native |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`| Cloud Storage bucket URL | Web & Native |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM messaging sender ID | Web & Native |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase Web application identifier | Web & Native |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth Web client ID | Native Google SDK |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID | iOS Native SDK |

---

## 10. Single Page Application (SPA) Hosting

Configured in [`netlify.toml`](../netlify.toml):
* **Build Command**: `npx expo export --platform web`
* **Publish Directory**: `dist`
* **Redirect Rule**: `/* -> /index.html 200` (ensures deep linking and page refresh without 404 errors).
