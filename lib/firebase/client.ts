/**
 * Firebase web SDK — initialised ONLY when NEXT_PUBLIC_FIREBASE_* env vars are present.
 * When absent (e.g. demo mode before keys are added), every export is null and the app
 * falls back to the local store + demo auth. This keeps the app runnable with zero setup.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (firebaseEnabled) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
