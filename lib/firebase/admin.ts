/**
 * Firebase Admin SDK for server-side route handlers.
 * Initialised only when FIREBASE_SERVICE_ACCOUNT is provided. Otherwise null and the
 * agent routes operate in stateless mode (the client persists to the local store).
 */
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (raw) {
  try {
    const serviceAccount = JSON.parse(raw);
    adminApp = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert(serviceAccount) });
    adminDb = getFirestore(adminApp);
  } catch (err) {
    console.error("[firebase/admin] Invalid FIREBASE_SERVICE_ACCOUNT JSON:", err);
  }
}

export const adminEnabled = Boolean(adminDb);
export { adminApp, adminDb };
