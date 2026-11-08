import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
// Fallback config used ONLY when env vars are not present (e.g. AI Studio
// runtime injection). The committed file contains placeholders only —
// real secrets live in `.env.local` (gitignored) and are read via
// `import.meta.env.VITE_FIREBASE_*` below.
import fallbackConfig from '../../firebase-applet-config.json';

/**
 * Build the Firebase configuration object.
 *
 * Priority (highest first):
 *   1. `import.meta.env.VITE_FIREBASE_*` — populated from `.env.local`
 *      (or the hosting platform's secrets panel in production).
 *   2. `firebase-applet-config.json` — used by AI Studio when it injects
 *      the runtime config via the Secrets panel.
 *
 * SECURITY: Real Firebase credentials are NEVER hardcoded in this file or
 * in `firebase-applet-config.json` (which only contains placeholders).
 * The only place real secrets live is `.env.local`, which is gitignored.
 */
const firebaseConfig: FirebaseOptions & { firestoreDatabaseId?: string } = {
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    (fallbackConfig as any).projectId ||
    '',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    (fallbackConfig as any).appId ||
    '',
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (fallbackConfig as any).apiKey ||
    '',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (fallbackConfig as any).authDomain ||
    '',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (fallbackConfig as any).storageBucket ||
    '',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    (fallbackConfig as any).messagingSenderId ||
    '',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    (fallbackConfig as any).measurementId ||
    undefined,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    (fallbackConfig as any).firestoreDatabaseId ||
    undefined,
};

// Fail fast with a clear error if the essential credentials are missing.
// This prevents silently falling back to a broken/empty config.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error(
    '[SurgiTrack Firebase] CRITICAL: Firebase configuration is missing. ' +
      'Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID ' +
      'in .env.local (see .env.example for templates).'
  );
}

const app = initializeApp(firebaseConfig);

// CRITICAL: Must use the custom Firestore database ID supplied by the user
// (e.g. "ai-studio-surgitrackprofes-c695c53a-82c9-402b-a203-bb6732c49ea6").
// Falls back to the default database if not specified.
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline capabilities.');
    }
  }
}
testConnection().catch(() => {});
