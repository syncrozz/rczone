import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Machine, RidePackage, Session, TransactionRecord, QueueItem, AppSettings, AssetType, CustomerAlert } from '../types';
import { DEFAULT_MACHINES, DEFAULT_ASSET_TYPES, DEFAULT_PACKAGES, DEFAULT_SETTINGS } from '../utils/storage';

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
  assetTypes?: AssetType[];
  packages: RidePackage[];
  sessions: Session[];
  transactions: TransactionRecord[];
  queue: QueueItem[];
  settings: AppSettings;
  customerAlerts?: CustomerAlert[];
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
          assetTypes: DEFAULT_ASSET_TYPES,
          packages: DEFAULT_PACKAGES,
          sessions: [],
          transactions: [],
          queue: [],
          settings: DEFAULT_SETTINGS,
          customerAlerts: [],
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

/**
 * Notify Admin that customer stopped the alarm / requested early finish
 */
export async function notifyCustomerAlarmStopped(
  sessionId: string,
  machineId: string,
  machineName: string,
  customerName: string,
  reason: 'TIME_UP_STOPPED' | 'EARLY_STOPPED'
): Promise<void> {
  try {
    await ensureAuth();
    const docRef = doc(db, SYNC_COLLECTION, SYNC_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as CloudSystemState;
    const currentSessions = data.sessions || [];
    const currentAlerts = data.customerAlerts || [];

    const now = Date.now();

    // 1. Update session status
    const updatedSessions = currentSessions.map((s) => {
      if (s.id === sessionId || s.machineId === machineId) {
        return {
          ...s,
          customerStoppedAlarmAt: now,
          customerStoppedAlarmReason: reason,
        };
      }
      return s;
    });

    // 2. Create customer alert for Admin HUD
    const newAlert: CustomerAlert = {
      id: `alert_${now}_${sessionId}`,
      sessionId,
      machineId,
      machineName,
      customerName,
      type: reason === 'EARLY_STOPPED' ? 'EARLY_STOP' : 'ALARM_STOPPED',
      message:
        reason === 'EARLY_STOPPED'
          ? `Pelanggan ${customerName} (${machineName}) telah menamatkan sesi lebih awal di telefon.`
          : `Pelanggan ${customerName} (${machineName}) telah menghentikan penggera siren masa tamat di telefon.`,
      timestamp: now,
      acknowledged: false,
    };

    // Keep max 20 latest alerts
    const updatedAlerts = [newAlert, ...currentAlerts.filter((a) => now - a.timestamp < 3600000)].slice(0, 20);

    await setDoc(
      docRef,
      {
        sessions: updatedSessions,
        customerAlerts: updatedAlerts,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Error notifying customer alarm stop to admin:', err);
  }
}
