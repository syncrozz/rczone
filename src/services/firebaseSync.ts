import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings } from '../types';
import { DEFAULT_MACHINES, DEFAULT_PACKAGES, DEFAULT_SETTINGS } from '../utils/storage';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);

// Authenticate anonymously so security rules work seamlessly
let authPromise: Promise<void> | null = null;
export function ensureAuth(): Promise<void> {
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve();
        } else {
          signInAnonymously(auth)
            .then(() => resolve())
            .catch((err) => {
              console.warn('Anonymous auth error:', err);
              resolve();
            });
        }
      });
    });
  }
  return authPromise;
}

// Global Cloud Sync Root Document
const SYNC_COLLECTION = 'rc_system';
const SYNC_DOC_ID = 'state';

export interface CloudSystemState {
  machines: Machine[];
  packages: RidePackage[];
  sessions: Session[];
  transactions: TransactionRecord[];
  queue: QueueItem[];
  settings: AppSettings;
  updatedAt: number;
}

/**
 * Subscribe to real-time Cloud updates across all devices
 */
export function subscribeToCloudSync(
  onUpdate: (data: Partial<CloudSystemState>) => void,
  onError?: (err: Error) => void
): () => void {
  ensureAuth();
  const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudSystemState;
        onUpdate(data);
      } else {
        // First time initialization in Cloud Firestore
        const initialState: CloudSystemState = {
          machines: DEFAULT_MACHINES,
          packages: DEFAULT_PACKAGES,
          sessions: [],
          transactions: [],
          queue: [],
          settings: DEFAULT_SETTINGS,
          updatedAt: Date.now(),
        };
        setDoc(docRef, initialState, { merge: true }).catch((err) =>
          console.warn('Initial cloud seed error:', err)
        );
      }
    },
    (error) => {
      console.warn('Realtime cloud sync listener error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Push partial state changes to Cloud Firestore
 */
export async function pushCloudUpdate(partialState: Partial<CloudSystemState>): Promise<void> {
  try {
    await ensureAuth();
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    await setDoc(
      docRef,
      {
        ...partialState,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error pushing update to Cloud Firestore:', err);
  }
}
