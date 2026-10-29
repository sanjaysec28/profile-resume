/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Firebase Client Initialization
 * Minimal, free-tier conscious Firebase Authentication & Cloud Firestore setup.
 * Single initialization instance across the application.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Checks whether real Firebase environment variables have been supplied.
 */
export function checkFirebaseConfig(): FirebaseConfigStatus {
  const missingKeys: string[] = [];

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-') || firebaseConfig.apiKey.includes('MY_')) {
    missingKeys.push('VITE_FIREBASE_API_KEY');
  }
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes('your-')) {
    missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  }
  if (!firebaseConfig.projectId || firebaseConfig.projectId.includes('your-')) {
    missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  }
  if (!firebaseConfig.appId || firebaseConfig.appId.includes('your-')) {
    missingKeys.push('VITE_FIREBASE_APP_ID');
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

const configStatus = checkFirebaseConfig();

if (configStatus.isConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (err) {
    console.error('[ProFile Firebase Init Error]:', err);
  }
} else {
  console.info(
    '[ProFile Firebase Info]: Real Firebase credentials have not been configured yet. Awaiting environment variables:',
    configStatus.missingKeys.join(', ')
  );
}

export { app, auth, db, googleProvider };
