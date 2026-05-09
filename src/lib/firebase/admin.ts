import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _firestore: Firestore | null = null;

function getFirebaseAdmin(): Firestore {
  if (_firestore) return _firestore;

  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY env var is missing. " +
        "Set it to the full JSON content of your Firebase service account key."
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  _firestore = getFirestore();
  return _firestore;
}

/**
 * Lazy-initialized Firestore instance.
 * Safe for Vercel serverless (handles warm container reuse).
 */
export function getDb(): Firestore {
  return getFirebaseAdmin();
}

/** Collection reference helpers */
export const collections = {
  informes: () => getDb().collection("informes"),
  pdfs: (informeId: string) =>
    getDb().collection("informes").doc(informeId).collection("pdfs"),
  posts: (informeId: string) =>
    getDb().collection("informes").doc(informeId).collection("posts"),
  crasStatus: () => getDb().collection("crasStatus"),
  emailSubscribers: () => getDb().collection("emailSubscribers"),
};
